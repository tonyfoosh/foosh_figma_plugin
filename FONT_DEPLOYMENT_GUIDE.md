# Gilroy Font Deployment Guide

## 🎯 Overview

This guide explains how to deploy Gilroy (and other custom fonts) across the entire Foosh stack:

1. **Figma Plugin** → Generates HTML with S3 font URLs
2. **Frontend (workflow-next)** → Loads fonts from S3
3. **Backend (async-workflows-html-n)** → Playwright renders with installed fonts

---

## ✅ What Has Been Implemented

### 1. Figma Plugin Updates

**File**: `packages/backend/src/html/fontCollector.ts`

**Changes**:
- ✅ Updated `generateCustomFontFaces()` to use S3 URLs
- ✅ Changed from: `url('./fonts/Gilroy-SemiBold.woff2')`
- ✅ Changed to: `url('https://workflow-outputs.s3.amazonaws.com/fonts/Gilroy-SemiBold.woff2')`
- ✅ Updated comments to reflect S3 hosting

**Result**: Plugin now generates `@font-face` rules pointing to S3

---

### 2. Backend HTML Renderer Updates

**Files Modified**:
- `src/lambdas/html_renderer/Dockerfile`
- `src/lambdas/html_renderer/fonts/` (new directory)

**Changes**:
- ✅ Added font installation in Dockerfile
- ✅ Copies fonts to `/usr/share/fonts/truetype/custom/`
- ✅ Runs `fc-cache -f -v` to refresh font cache
- ✅ Playwright can now render Gilroy fonts

**Result**: Docker container has Gilroy fonts installed

---

### 3. S3 Upload Script

**File**: `scripts/upload_fonts_to_s3.sh` (in async-workflows-html-n)

**Features**:
- ✅ Uploads all fonts from `src/lambdas/html_renderer/fonts/` to S3
- ✅ Sets correct Content-Type headers
- ✅ Adds public-read ACL
- ✅ Sets cache headers (1 year immutable)

**Result**: Fonts are publicly accessible on S3

---

## 📋 Deployment Steps

### Step 1: Get Gilroy Font Files

You need `.woff2` format (recommended) or `.ttf` format.

**Required weights** (based on Figma designs):
- Gilroy-Light.woff2 (300)
- Gilroy-Regular.woff2 (400)
- Gilroy-Medium.woff2 (500)
- Gilroy-SemiBold.woff2 (600)
- Gilroy-Bold.woff2 (700)
- Gilroy-ExtraBold.woff2 (800)

**Where to get them**:
- Purchase from official source
- Check if you have licenses already
- Convert from `.ttf` or `.otf` using online tools

---

### Step 2: Add Fonts to Backend

```bash
# Navigate to backend repo
cd /Users/aman/Documents/GitHub/async-workflows-html-n

# Copy font files to fonts directory
cp /path/to/your/gilroy/fonts/*.woff2 \
   src/lambdas/html_renderer/fonts/

# Verify fonts are there
ls -la src/lambdas/html_renderer/fonts/
```

Expected output:
```
Gilroy-Regular.woff2
Gilroy-Medium.woff2
Gilroy-SemiBold.woff2
Gilroy-Bold.woff2
Gilroy-ExtraBold.woff2
```

---

### Step 3: Upload Fonts to S3

```bash
# Make upload script executable (if not already)
chmod +x scripts/upload_fonts_to_s3.sh

# Upload fonts to S3
./scripts/upload_fonts_to_s3.sh
```

**What this does**:
- Uploads fonts to `s3://workflow-outputs/fonts/`
- Sets public-read permissions
- Adds cache headers
- Makes fonts accessible at:
  ```
  https://workflow-outputs.s3.amazonaws.com/fonts/Gilroy-SemiBold.woff2
  ```

---

### Step 4: Rebuild & Deploy Backend

```bash
# Still in async-workflows-html-n directory

# Rebuild Docker image with fonts
./scripts/deploy_html_renderer_quick.sh
```

**What this does**:
- Builds new Docker image with fonts installed
- Pushes to ECR
- Updates Lambda function
- Playwright can now render Gilroy fonts

---

### Step 5: Rebuild & Deploy Figma Plugin

```bash
# Navigate to Figma plugin repo
cd /Users/aman/Documents/GitHub/foosh_figma_plugin

# Rebuild plugin
pnpm build

# Reload in Figma
# Go to: Plugins → Development → Foosh Figma Plugin → "Reload"
```

---

### Step 6: Test End-to-End

1. **Test Figma Plugin**:
   - Open Figma with a design using Gilroy
   - Run Foosh Plugin
   - Click "Copy HTML/CSS"
   - Verify `@font-face` has S3 URLs:
     ```css
     @font-face {
       font-family: 'Gilroy';
       src: url('https://workflow-outputs.s3.amazonaws.com/fonts/Gilroy-SemiBold.woff2') format('woff2');
       font-weight: 600;
     }
     ```

2. **Test Frontend Preview**:
   - Open workflow-next frontend
   - Paste HTML into HtmlTemplateNode
   - Check browser DevTools → Network tab
   - Verify fonts load (200 status)
   - Text should render in Gilroy

3. **Test Playwright Backend**:
   - Trigger HTML render in backend
   - Check Lambda CloudWatch logs
   - Verify no font warnings
   - Download rendered image
   - Text should be in Gilroy (not Arial fallback)

---

## 🔍 Troubleshooting

### Issue: Fonts not rendering in Playwright

**Symptoms**:
- Text appears in Arial/sans-serif fallback
- CloudWatch logs show font warnings

**Solutions**:
1. Check fonts are in `src/lambdas/html_renderer/fonts/`
2. Rebuild Docker: `./scripts/deploy_html_renderer_quick.sh`
3. Check Dockerfile has font installation lines
4. Verify font family name matches exactly

**Debug commands**:
```bash
# Check fonts in Docker container (local test)
docker run -it <image-id> /bin/bash
fc-list | grep Gilroy

# Check Lambda logs
aws logs tail /aws/lambda/html-renderer-staging --follow
```

---

### Issue: Fonts not loading in browser

**Symptoms**:
- Browser shows 404 for font URLs
- DevTools Console shows CORS errors
- Text renders in fallback font

**Solutions**:
1. Upload fonts: `./scripts/upload_fonts_to_s3.sh`
2. Check S3 bucket policy allows public-read
3. Verify URL matches exactly:
   - Plugin: `Gilroy-SemiBold.woff2`
   - S3: `Gilroy-SemiBold.woff2`
   - (case-sensitive!)

**Debug commands**:
```bash
# Test font is accessible
curl -I https://workflow-outputs.s3.amazonaws.com/fonts/Gilroy-SemiBold.woff2

# Should return:
# HTTP/1.1 200 OK
# Content-Type: font/woff2
```

---

### Issue: Different rendering in Playwright vs Browser

**Symptoms**:
- Font looks slightly different
- Weight appears different

**Cause**: Using different font files or formats

**Solution**: Use same `.woff2` files for both systems

---

## 📝 Font Naming Convention

**Important**: Font file names must match this pattern:

```
{FamilyName}-{WeightName}.woff2
```

**Examples**:
- ✅ `Gilroy-SemiBold.woff2` (correct)
- ❌ `gilroy-semibold.woff2` (lowercase - won't match)
- ❌ `Gilroy-Semi-Bold.woff2` (hyphen in weight - won't match)
- ❌ `Gilroy_SemiBold.woff2` (underscore - won't match)

**Weight mapping**:
| CSS Weight | Weight Name |
|------------|-------------|
| 100 | Thin |
| 200 | ExtraLight |
| 300 | Light |
| 400 | Regular |
| 500 | Medium |
| 600 | SemiBold |
| 700 | Bold |
| 800 | ExtraBold |
| 900 | Black |

---

## 🚀 Quick Reference

**Upload fonts to S3**:
```bash
cd /Users/aman/Documents/GitHub/async-workflows-html-n
./scripts/upload_fonts_to_s3.sh
```

**Deploy backend with fonts**:
```bash
cd /Users/aman/Documents/GitHub/async-workflows-html-n
./scripts/deploy_html_renderer_quick.sh
```

**Rebuild Figma plugin**:
```bash
cd /Users/aman/Documents/GitHub/foosh_figma_plugin
pnpm build
# Then reload in Figma UI
```

---

## 📊 Architecture Diagram

```
┌─────────────────┐
│  Figma Plugin   │
│  (foosh)        │
└────────┬────────┘
         │
         │ Generates HTML with:
         │ @font-face { src: url('https://workflow-outputs.s3...') }
         │
         ▼
┌─────────────────────────────────────────────┐
│                                             │
│         S3: workflow-outputs/fonts/         │
│  - Gilroy-SemiBold.woff2  (public-read)    │
│  - Gilroy-Bold.woff2                        │
│  - ...                                      │
│                                             │
└───────────┬────────────────────┬────────────┘
            │                    │
            │                    │
            ▼                    ▼
   ┌────────────────┐   ┌───────────────────┐
   │   Frontend     │   │   Backend         │
   │ (workflow-next)│   │ (async-workflows) │
   │                │   │                   │
   │ Browser loads  │   │ Playwright has    │
   │ fonts from S3  │   │ fonts installed   │
   │                │   │ in Docker         │
   └────────────────┘   └───────────────────┘
```

---

## ✅ Success Checklist

- [ ] Obtained Gilroy font files (.woff2)
- [ ] Added fonts to `src/lambdas/html_renderer/fonts/`
- [ ] Uploaded fonts to S3: `./scripts/upload_fonts_to_s3.sh`
- [ ] Deployed backend: `./scripts/deploy_html_renderer_quick.sh`
- [ ] Rebuilt Figma plugin: `pnpm build`
- [ ] Tested Figma plugin output has S3 URLs
- [ ] Tested frontend can load fonts from S3
- [ ] Tested Playwright renders fonts correctly

---

## 🎉 You're Done!

Gilroy fonts are now fully integrated across your entire stack!

**Next time you add fonts**: Just repeat Steps 2-4 and the new fonts will work everywhere.