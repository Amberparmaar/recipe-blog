/**
 * Cloudinary unsigned image upload
 * --------------------------------
 * 1. Create free account at https://cloudinary.com
 * 2. Go to Settings > Upload > Upload presets
 * 3. Create an unsigned preset (or enable unsigned for a preset)
 * 4. Note your Cloud Name and Upload Preset name
 * 5. Paste them below
 */

const CLOUD_NAME = 'cfnqmyif';
const UPLOAD_PRESET = 'testing'; 

/**
 * Upload a file to Cloudinary and return the secure URL
 * @param {File} file
 * @param {function} onProgress - optional progress callback (0-100)
 */
export async function uploadImage(file, onProgress) {
  // Validation
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowed.includes(file.type)) {
    throw new Error('Only JPG, PNG, WEBP or GIF images are allowed.');
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Image must be smaller than 5 MB.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const res = JSON.parse(xhr.responseText);
        resolve(res.secure_url);
      } else {
        reject(new Error('Upload failed. Please try again.'));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload.'));
    xhr.send(formData);
  });
}