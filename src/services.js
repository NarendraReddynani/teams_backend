import { GridFsStorage } from 'multer-gridfs-storage';

// Example of a GridFS storage configuration
export const configureGridFsStorage = (url, bucketName='uploads') => {
  return new GridFsStorage({
    url: url, // MongoDB connection string
    file: (req, file) => {
      return new Promise((resolve, reject) => {
        const fileInfo = {
          filename: `${Date.now()}_${file.originalname}`,
          bucketName: bucketName // e.g., 'photos'
        };
        resolve(fileInfo);
      });
    }
  });
};
