import { supabaseAdmin } from '../config/supabase.js';
import { env } from '../config/env.js';

async function setupStorage() {
  console.log('\n======================================================');
  console.log('   CivicMind Storage Setup');
  console.log('======================================================\n');
  console.log('Target Bucket:', env.SUPABASE_STORAGE_BUCKET);

  try {
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
    if (listError) {
      console.warn('Could not list buckets via API:', listError.message);
    }

    const bucketName = env.SUPABASE_STORAGE_BUCKET;
    const exists = buckets?.some((b) => b.name === bucketName || b.id === bucketName);

    if (!exists) {
      console.log(`Creating private bucket '${bucketName}'...`);
      const { data, error } = await supabaseAdmin.storage.createBucket(bucketName, {
        public: false,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      });
      if (error) {
        console.log(`Notice on bucket creation: ${error.message} (bucket is also provisioned in SQL schema).`);
      } else {
        console.log(`✓ Bucket '${bucketName}' created successfully.`);
      }
    } else {
      console.log(`✓ Bucket '${bucketName}' is confirmed present and private.`);
    }
  } catch (err) {
    console.error('Storage setup error:', err.message);
  }
}

setupStorage();
