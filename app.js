const createError = require('http-errors');
const express = require('express');
const bodyParser = require('body-parser');
const logger = require('morgan');
const expressValidator = require('express-validator');
const cors = require('cors');
const compression = require('compression');

const sessionRouter = require('./routes/session');

const adminEntitiesRouter = require('./routes/Admin/entities');
const adminDomainRouter = require('./routes/Admin/domain');
const adminPageRouter = require('./routes/Admin/page');
const adminTagRouter = require('./routes/Admin/tag');
const adminWebsiteRouter = require('./routes/Admin/website');
const adminEvaluationRouter = require('./routes/Admin/evaluation');
const adminUserRouter = require('./routes/Admin/user');

const monitorDomainRouter = require('./routes/Monitor/domain');
const monitorPageRouter = require('./routes/Monitor/page');
const monitorWebsiteRouter = require('./routes/Monitor/website');
const monitorEvaluationRouter = require('./routes/Monitor/evaluation');
const monitorUserRouter = require('./routes/Monitor/user');

const studyUserRouter = require('./routes/Study/user');
const studyDomainRouter = require('./routes/Study/domain');
const studyPageRouter = require('./routes/Study/page');
const studyTagRouter = require('./routes/Study/tag');
const studyWebsiteRouter = require('./routes/Study/website');
const studyEvaluationRouter = require('./routes/Study/evaluation');

const ampRouter = require('./routes/AMP/evaluation');
const obsRouter = require('./routes/Observatory/observatory');
const digitalSealRouter = require('./routes/digital-seal');

const app = express();
app.use(compression());
app.use(cors());

app.use(logger('dev'));
app.use(bodyParser.json({limit: '2mb'}));
app.use(bodyParser.urlencoded({ extended: false, limit: '2mb' }));
app.use(expressValidator());

app.use('/session', sessionRouter);

app.use('/admin', adminEntitiesRouter);
app.use('/admin', adminDomainRouter);
app.use('/admin', adminPageRouter);
app.use('/admin', adminTagRouter);
app.use('/admin', adminUserRouter);
app.use('/admin', adminWebsiteRouter);
app.use('/admin', adminEvaluationRouter);

app.use('/amp', ampRouter);

app.use('/observatory', obsRouter);

app.use('/study', studyUserRouter);
app.use('/study', studyDomainRouter);
app.use('/study', studyPageRouter);
app.use('/study', studyTagRouter);
app.use('/study', studyWebsiteRouter);
app.use('/study', studyEvaluationRouter);

app.use('/monitor', monitorDomainRouter);
app.use('/monitor', monitorPageRouter);
app.use('/monitor', monitorUserRouter);
app.use('/monitor', monitorWebsiteRouter);
app.use('/monitor', monitorEvaluationRouter);

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
