const express = require("express");

const app=express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const { swaggerSetup } = require("./config/swagger");

swaggerSetup(app);


app.get('/',(req,res)=>{
    res.send()
})

module.exports = app;
