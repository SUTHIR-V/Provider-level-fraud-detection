import 'dotenv/config';

export const config = {
  mongoUri: process.env.MONGO_URI,
  dbName: process.env.DB_NAME || 'ClaimsDB',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  port: Number(process.env.PORT || 3000),

  collections: {
    users: 'Users',
    existingClaims: 'ExistingClaims',
    newClaims: 'NewClaims'
  },

  // Azure ML Scoring
  mlUrl: process.env.ML_URL || '',
  mlKey: process.env.ML_KEY || ''
};
