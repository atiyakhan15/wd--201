const { Todo } = require("./models");
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.get("/", function (request, response) {
  response.send("the great sanket jambhulkar ");
});
/* eslint-disable-next-line no-unused-vars */
app.get("/todos", function (request, response) {
  console.log("Processing list of all Todos ...");
  // First, we have to query our PostgerSQL database using Sequelize to get list of all Todos.
  // Then, we have to respond with all Todos, like:
  // response.send(todos)
});
/* eslint-disable-next-line no-unused-vars */
app.get("/todos/:id", function (request, response) {
  console.log("Looking for Todo with ID: ", request.params.id);
  // First, we have to query our database to get details of a Todo with a specific ID.
  // Then, we have to respond back:
  // response.send(todo)
});
app.post("/todos", async function (request, response) {
  console.log("Creating new Todo: ", request.body);
  try {
    const todo = await Todo.addTodo({
      title: request.body.title,
      dueDate: request.body.dueDate,
      completed: false,
    });
    return response.json(todo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});
app.put("/todos/:id/markAsCompleted", async function (request, response) {
  console.log("We have to update a Todo with ID: ", request.params.id);
  const todo = await Todo.findByPk(request.params.id);
  try {
    const updatedTodo = await todo.markAsCompleted();
    return response.json(updatedTodo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});
/* eslint-disable-next-line no-unused-vars */
app.delete("/todos/:id", function (request, response) {
  console.log("We have to delete a Todo with ID: ", request.params.id);
  // First, we have to query our database to delete a Todo by ID.
  // Then, we have to respond back with some simplete message like "To-Do deleted successfully":
  // response.send("Todo deleted successfully")
});
module.exports = app;
