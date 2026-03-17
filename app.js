const express = require("express");

const app=express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const { swaggerSetup } = require("./config/swagger");

swaggerSetup(app);



const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const schemaRoutes = require('./routes/schemaRoutes');
const fileRoutes = require('./routes/fileRoutes');
const reportRoutes = require('./routes/reportRoutes');

app.use(express.json());

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/dashboards', dashboardRoutes);
app.use('/schemas', schemaRoutes);
app.use('/files', fileRoutes);
app.use('/reports', reportRoutes);


app.get('/',(req,res)=>{
    res.send()
})

module.exports = app;
