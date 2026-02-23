# 📦 File Upload Setup Guide for Railway

## ✅ What I've Added:

1. **Cloudinary SDK** - Free cloud storage integration
2. **CloudinaryConfig** - Auto-configures when enabled
3. **CloudinaryService** - Handles upload/delete to cloud
4. **Updated FileStorageService** - Smart switching between local/cloud storage

## 🚀 Setup Instructions:

### Step 1: Create Free Cloudinary Account

1. Go to https://cloudinary.com/users/register/free
2. Sign up (it's 100% FREE - no credit card required)
3. After login, go to Dashboard
4. Copy these credentials:
   - Cloud Name
   - API Key
   - API Secret

### Step 2: Configure Railway Environment Variables

Add these to your Railway service:

```bash
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
CLOUDINARY_ENABLED=true
```

### Step 3: Deploy to Railway

Push your code and Railway will automatically:

- Install Cloudinary SDK
- Use cloud storage for all uploads
- Store images permanently (25GB free!)

## 🔄 How It Works:

- **With Cloudinary enabled**: Files upload to cloud, returns full URL
- **Without Cloudinary**: Falls back to local storage (for local development)

Your code doesn't change! The `FileStorageService` automatically:

- Detects if Cloudinary is enabled
- Routes uploads to the appropriate storage
- Handles deletions from the correct location

## 📝 Local Development:

For local testing, keep Cloudinary disabled:

```properties
cloudinary.enabled=false
```

Files will save to `uploads/salons` locally.

## 🎁 Cloudinary Free Tier Benefits:

✅ 25 GB storage  
✅ 25 GB bandwidth/month  
✅ Image transformations (resize, crop, etc.)  
✅ No credit card required  
✅ Perfect for small-medium projects

## 💡 Alternative Options:

If you prefer other free services:

### Option 2: Supabase Storage (1GB free)

- Sign up at https://supabase.com
- Create a bucket
- Use their SDK (similar integration)

### Option 3: Railway Volumes (1GB free)

- Add to Railway project
- Mount at `/app/uploads`
- Limited space but simple

## ⚠️ Important Notes:

1. **Database stores URLs**: Your database will store full Cloudinary URLs
2. **No migration needed**: Old local files work fine locally
3. **Production ready**: Cloudinary handles CDN, backups, scaling
4. **Images persist**: Even if Railway restarts, images stay safe

Your app is now production-ready with persistent file storage! 🎉
