const createError = require('http-errors');
const express = require('express');
const bodyParser = require('body-parser');
const logger = require('morgan');
const expressValidator = require('express-validator');
const cors = require('cors');
const compression = require('compression');
const path = require('path');

const sessionRouter = require('./routes/session');

const adminEntitiesRouter = require('./routes/admin/entity');
const adminDomainRouter = require('./routes/admin/domain');
const adminPageRouter = require('./routes/admin/page');
const adminTagRouter = require('./routes/admin/tag');
const adminWebsiteRouter = require('./routes/admin/website');
const adminEvaluationRouter = require('./routes/admin/evaluation');
const adminUserRouter = require('./routes/admin/user');
const adminCrawlerRouter = require('./routes/admin/crawler');

const monitorDomainRouter = require('./routes/monitor/domain');
const monitorPageRouter = require('./routes/monitor/page');
const monitorWebsiteRouter = require('./routes/monitor/website');
const monitorEvaluationRouter = require('./routes/monitor/evaluation');
const monitorUserRouter = require('./routes/monitor/user');

const studyUserRouter = require('./routes/study/user');
const studyDomainRouter = require('./routes/study/domain');
const studyPageRouter = require('./routes/study/page');
const studyTagRouter = require('./routes/study/tag');
const studyWebsiteRouter = require('./routes/study/website');
const studyEvaluationRouter = require('./routes/study/evaluation');

const ampRouter = require('./routes/amp/evaluation');
const obsRouter = require('./routes/observatory/observatory');
const digitalStampRouter = require('./routes/digital-stamp');

const app = express();
app.use(compression());
app.use(cors());

app.use(logger('dev'));
app.use(bodyParser.json({limit: '2mb'}));
app.use(bodyParser.urlencoded({ extended: false, limit: '2mb' }));
app.use(expressValidator());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/session', sessionRouter);

app.use('/admin', adminEntitiesRouter);
app.use('/admin', adminDomainRouter);
app.use('/admin', adminPageRouter);
app.use('/admin', adminTagRouter);
app.use('/admin', adminUserRouter);
app.use('/admin', adminWebsiteRouter);
app.use('/admin', adminEvaluationRouter);
app.use('/admin', adminCrawlerRouter);

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

app.use('/digitalStamp', digitalStampRouter);

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
