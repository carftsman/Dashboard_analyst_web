const express = require("express");
const cors=require("cors")

const app=express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors('*'));
const { swaggerSetup } = require("./config/swagger");

swaggerSetup(app);



const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const schemaRoutes = require('./routes/schemaRoutes');
const fileRoutes = require('./routes/fileRoutes');
const reportRoutes = require('./routes/reportRoutes');
const manageUserRoutes = require('./routes/manageUserRoutes');
const userRoutes = require('./routes/userRoutes');
const dashboardAnalyticsRoutes = require('./routes/dashboardAnalyticsRoutes');
const dashboardWidgetRoutes = require('./routes/dashboardWidgetRoutes');
const columnRoutes = require('./routes/columnRoutes');
const patternRoutes = require('./routes/patternRoutes');

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/admin', dashboardRoutes);
app.use('/schemas', schemaRoutes);
app.use('/api/files', fileRoutes);
app.use('/reports', reportRoutes);
app.use('/api/manage-users', manageUserRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardAnalyticsRoutes);
app.use('/api/dashboard', dashboardWidgetRoutes);
app.use('/api/admin/dashboard', columnRoutes);
app.use('/api/pattern', patternRoutes);

app.get('/',(req,res)=>{
    res.send()
})

module.exports = app;
