/* eslint-disable */
/* eslint-disable no-undef */

const express = require("express");
const app = express();
var csrf = require("tiny-csrf");
const bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
app.use(bodyParser.json());
const path = require("path");
const { Todo } = require("./models");
// eslint-disable-next-line no-undef
const todo = require("./models/todo");

// eslint-disable-next-line no-undef
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("shh! some secret string"));
app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));

app.set("view engine", "ejs");
app.get("/", async function (request, response) {
  const overdue = await Todo.overdue();
  const dueLater = await Todo.dueLater();
  const dueToday = await Todo.dueToday();
  const Completed_Items = await Todo.completed_Items();
  const acceptsHTML =
    request && request.get("Accept")
      ? request.get("Accept").includes("text/html")
      : false;
  if (acceptsHTML) {
    response.render("index", {
      title: "Todo application",
      overdue,
      dueToday,
      dueLater,
      Completed_Items,
      csrfToken: request.csrfToken(),
    });
  } else {
    response.json({
      overdue,
      dueToday,
      dueLater,
      Completed_Items,
    });
  }
});
/* eslint-disable-next-line no-undef */
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: false }));
/* eslint-disable-next-line no-unused-vars */
app.get("/todos", async function (_request, response) {
  console.log("Processing list of all Todos ...");
  // FILL IN YOUR CODE HE
  try {
    const todos = await Todo.findAll();
    return response.json(todos);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});
/* eslint-disable-next-line no-unused-vars */
app.get("/todos/:id", async function (request, response) {
  try {
    const todo = await Todo.findByPk(request.params.id);
    return response.json(todo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.post("/todos", async function (request, response) {
  console.log("Creating new Todo: ", request.body);
  // eslint-disable-next-line no-unused-vars
  try {
    // eslint-disable-line
    // eslint-disable-next-line no-unused-vars
    const todo = await Todo.addTodo({
      // eslint-disable-line
      title: request.body.title, // eslint-disable-line
      dueDate: request.body.dueDate, // eslint-disable-line
      completed: false,
    }); // eslint-disable-line
    return response.redirect("/");
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});
app.put("/todos/:id", async (request, response) => {
  console.log("Mark Todo as completed:", request.params.id);
  const todo = await Todo.findByPk(request.params.id);
  try {
    const updatedtodo = await todo.setCompletionStatus(request.body.completed);
    return response.json(updatedtodo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});
/* eslint-disable-next-line no-unused-vars */
app.delete("/todos/:id", async (request, response) => {
  console.log("delete a todo with ID:", request.params.id);
  try {
    await Todo.remove(request.params.id);
    return response.json({ success: true });
  } catch (error) {
    return response.status(422).json(error);
  }
});

module.exports = app;
