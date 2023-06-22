//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require('mongoose');
const _ = require('lodash');

//* mandatory
const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
// *connect db
// mongoose.connect('mongodb://127.0.0.1:27017/todolistDB');
const  mongoAtlasUri = "mongodb+srv://fadlyadmin:admin123@cluster0.8kprggd.mongodb.net/?retryWrites=true&w=majority";

console.log(mongoose.connection.readyState);

mongoose.connect(mongoAtlasUri,{
    dbName : 'todolistDB' 
  })
  .then((con) => {
    // console.log(con.connections);
    console.log('DB connection successful!');
    console.log(mongoose.connection.readyState);
    console.log('==============================');
  });


const workItems = [];
const itemSchema = new mongoose.Schema({
  name: String
});

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema]
});

const Item = mongoose.model('Item', itemSchema);
const List = mongoose.model('List', listSchema);

const item1 = new Item({
  name : "Welcome to do list!"
});
const item2 = new Item({
  name : "Hit + to add an item list!"
});
const item3 = new Item({
  name : "<-- hit this to delete an item!"
});

const defaultItem = [item1, item2, item3];

app.get("/", function(req, res) {

const day = date.getDate();

  Item.find({}).then(function(items){
    if (items.length == 0) {
      //insert many
      Item.insertMany(defaultItem).then(function () {
        console.log("Successfully saved DB");
      })
      .catch(function (err) {
        console.log("ERROR! "+ err);
      });
      res.redirect('/');
    } else {
      console.log('showing data.');
      res.render("list", {
        listTitle : 'TODAY',
        newListItems : items
      });
    }
  }).catch(function (err) {
    console.log(err);
  });


});

app.post("/delete",function (req, res) {
  const checkedItemId = req.body.ckItem;
  const listName = req.body.listName; 
  if (listName === 'TODAY') {
    Item.findByIdAndRemove(checkedItemId).then(()=>{
      console.log('Success Delete item!');
      res.redirect('/')
    }).catch((err)=>{
      // console.log("ERROR : "+err);
      res.redirect('/'+listName)
    })
  } else {
    List.findOneAndUpdate({name : listName},{$pull : {items : {_id : checkedItemId}}} ).then((res)=>{
      console.log(res);
      console.log('Success Delete item from list!');
      res.redirect('/'+listName);
    }).catch((err)=>{
      console.log('ERROR : '+err);
      res.redirect('/'+listName);
    })
  }
})

app.post("/", function(req, res){
  
  const itemName = req.body.newItem;
  const listName = req.body.list;
  
  const item = new Item({
    name:itemName
  });
  
  // insert add data 
  if (listName === 'Today' || listName === 'TODAY') {
    item.save().then(() => console.log('saved data!'));
    res.redirect('/');  
  } else {
    List.findOne({name:listName}).then((result)=>{
      if (!result) {
        console.log('List ' +listName+ 'and data NOT FOUND!!');
      } else {
        result.items.push(item);
        result.save()
        .then(()=> console.log('Saved!'))
        .catch((err)=>{console.log('ERROR '+listName+' : '+err);})
        res.redirect("/"+listName);
      }
    })
  }

});

// custom dynamic route 
app.get("/:customListName", (req, res) => {
  const listName = _.capitalize(req.params.customListName);

  List.findOne({name : listName}).then((result) => {
    if (!result) { //jika null
      // console.log(res);
      const list = new List({
        name : listName,
        items : defaultItem  
      });
      list.save().then(() => console.log('saved data list!'));
      res.redirect('/'+listName);
    }else{
      // console.log('else '+res );
      res.render("list", {
        listTitle : result.name,
        newListItems : result.items
      });
    }
  });

})

// app.get("/work", function(req,res){
//   res.render("list", {listTitle: "Work List", newListItems: workItems});
// });

// app.get("/about", function(req, res){
//   res.render("about");
// });

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
