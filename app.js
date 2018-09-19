const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const logger = require('morgan');
const expressValidator = require('express-validator');
const cors = require('cors');
const compression = require('compression');

const sessionRouter = require('./routes/session');
const adminRouter = require('./routes/admin');
const ampRouter = require('./routes/amp');
const obsRouter = require('./routes/observatorio');
const studiesRouter = require('./routes/studies');
const monitorRouter = require('./routes/monitor');

const app = express();
app.use(compression());
app.use(cors());

// view engine setup
//app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(expressValidator());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/session', sessionRouter);
app.use('/admin', adminRouter);
app.use('/amp', ampRouter);
app.use('/obs', obsRouter);
app.use('/studies', studiesRouter);
app.use('/monitor', monitorRouter);

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
  res.render('error');
});

module.exports = app;