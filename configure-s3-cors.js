const { S3Client, PutBucketCorsCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

// Configure S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME;

async function configureCORS() {
  try {
    console.log('🔧 Configuring CORS for S3 bucket:', BUCKET_NAME);
    
    const corsConfig = [
      {
        AllowedHeaders: [
          'Authorization',
          'Content-Type',
          'Accept',
          'Origin',
          'X-Requested-With',
          'Range',
          'If-Range',
          'If-Modified-Since',
          'If-None-Match',
          'X-Frame-Options',
          'X-Content-Type-Options'
        ],
        AllowedMethods: ['GET', 'HEAD', 'OPTIONS'],
        AllowedOrigins: ['*'],
        ExposeHeaders: [
          'Content-Type',
          'Content-Length',
          'Content-Range',
          'Accept-Ranges',
          'ETag',
          'Last-Modified',
          'Cache-Control',
          'Content-Disposition',
          'X-Frame-Options',
          'X-Content-Type-Options'
        ],
        MaxAgeSeconds: 3600
      }
    ];

    const command = new PutBucketCorsCommand({
      Bucket: BUCKET_NAME,
      CORSConfiguration: {
        CORSRules: corsConfig
      }
    });

    await s3Client.send(command);
    console.log('✅ CORS configuration applied successfully!');
    console.log('📋 CORS Rules:');
    corsConfig.forEach((rule, index) => {
      console.log(`   Rule ${index + 1}:`);
      console.log(`     - Allowed Origins: ${rule.AllowedOrigins.join(', ')}`);
      console.log(`     - Allowed Methods: ${rule.AllowedMethods.join(', ')}`);
      console.log(`     - Allowed Headers: ${rule.AllowedHeaders.join(', ')}`);
    });
    
  } catch (error) {
    console.error('❌ Error configuring CORS:', error);
    console.log('\n🔧 Manual CORS Configuration:');
    console.log('1. Go to AWS S3 Console');
    console.log('2. Select your bucket:', BUCKET_NAME);
    console.log('3. Go to "Permissions" tab');
    console.log('4. Scroll down to "Cross-origin resource sharing (CORS)"');
    console.log('5. Click "Edit" and paste this configuration:');
    console.log(JSON.stringify([
      {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "HEAD"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": ["ETag", "x-amz-meta-custom-header"],
        "MaxAgeSeconds": 3000
      }
    ], null, 2));
  }
}

// Run the configuration
configureCORS();
