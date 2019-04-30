const createError = require('http-errors');
const express = require('express');
const bodyParser = require('body-parser');
const logger = require('morgan');
const expressValidator = require('express-validator');
const cors = require('cors');
const compression = require('compression');

const sessionRouter = require('./routes/session');
const adminRouter = require('./routes/admin');
const ampRouter = require('./routes/amp');
const obsRouter = require('./routes/observatory');
const studyRouter = require('./routes/study');
const monitorRouter = require('./routes/monitor');
const digitalSealRouter = require('./routes/digital-seal');

const app = express();
app.use(compression());
app.use(cors());

app.use(logger('dev'));
app.use(bodyParser.json({limit: '2mb'}));
app.use(bodyParser.urlencoded({ extended: false, limit: '2mb' }));
app.use(expressValidator());

app.use('/session', sessionRouter);
app.use('/admin', adminRouter);
app.use('/amp', ampRouter);
app.use('/observatory', obsRouter);
app.use('/study', studyRouter);
app.use('/monitor', monitorRouter);
app.use('/digitalSeal', digitalSealRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.json({ success: err.status || 500, message: 'SERVICE_NOT_FOUND', errors: null, results: null });
});

module.exports = app;