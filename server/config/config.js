module.exports = {
  PROD: {
    main: 80,
    photoProcesser: 81
  },
  DEV: {
    main: 3000,
    photoProcessor: 'http://photo-processor:3001',
    curator: 'http://curator:3002'
  }
};