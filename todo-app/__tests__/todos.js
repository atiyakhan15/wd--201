/* eslint-disable no-undef */
const request = require("supertest");
var cheerio = require("cheerio");
const db = require("../models/index");
const app = require("../app");
//const todo = require("../models/todo");
let server, agent;

function extractCsrfToken(res) {
  var $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}

const login = async (agent, username, password) => {
  let res = await agent.get("/login");
  let csrfToken = extractCsrfToken(res);
  res = await agent.post("/session").send({
    email: username,
    password: password,
    _csrf: csrfToken,
  });
};
const logout = async (agentt) => {
  const res = await agentt.get("/signout");
  return res;
};

describe("Todo test cases ", () => {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(4000, () => {});
    agent = request.agent(server);
  });
  afterAll(async () => {
    await db.sequelize.close();
    server.close();
  });

  test("Sign up", async () => {
    let res = await agent.get("/signup");
    const csrfToken = extractCsrfToken(res);
    res = await agent.post("/users").send({
      firstName: "Test",
      lastName: "User A",
      email: "user.a@test.com",
      password: "12345678",
      _csrf: csrfToken,
    });
    expect(res.statusCode).toBe(302);
  });
test("Sign up", async () => {
    let res = await agent.get("/signup");
    const csrfToken = extractCsrfToken(res);
    res = await agent.post("/users").send({
      firstName: "sanket",
      lastName: "User B",
      email: "user.b@test.com",
      password: "123456789",
      _csrf: csrfToken,
    });
    expect(res.statusCode).toBe(302);
  });
  test("Sign out", async () => {
    let res = await agent.get("/todos");
    expect(res.statusCode).toBe(200);
    res = await agent.get("/signout");
    expect(res.statusCode).toBe(302);
    res = await agent.get("/todos");
    expect(res.statusCode).toBe(302);
  });
   test("Mark todo as completed (Updating Todo)", async () => {
    const agent = request.agent(server);
    await login(agent, "user.a@test.com", "12345678");
    let res = await agent.get("/todos");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toLocaleDateString("en-CA"),
      completed: false,
      _csrf: csrfToken,
    });
    const gropuedTodosResponse = await agent
      .get("/todos")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(gropuedTodosResponse.text);
    const dueTodayCount = parsedGroupedResponse.dueToday.length;
    const latestTodo = parsedGroupedResponse.dueToday[dueTodayCount - 1];
    const status = latestTodo.completed ? false : true;
    res = await agent.get("/todos");
    csrfToken = extractCsrfToken(res);

    const response = await agent.put(`/todos/${latestTodo.id}`).send({
      _csrf: csrfToken,
      completed: status,
    });
    const parsedUpdateResponse = JSON.parse(response.text);
     await agent.get("/signout");
    expect(parsedUpdateResponse.completed).toBe(true);
  });
  test("Mark todo as incompleted (Updating Todo)", async () => {
    const agent = request.agent(server);
    await login(agent, "user.a@test.com", "12345678");
    let res = await agent.get("/todos");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "Buy chicken",
      dueDate: new Date().toLocaleDateString("en-CA"),
      completed: true,
      _csrf: csrfToken,
    });
    const gropuedTodosResponse = await agent
      .get("/todos")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(gropuedTodosResponse.text);
    console.log("sanket pre parsedGroupedResponse:",parsedGroupedResponse)
    const dueTodayCount = parsedGroupedResponse.dueToday.length;
    const latestTodo = parsedGroupedResponse.dueToday[dueTodayCount - 1];
    const status = latestTodo.completed ? false : true;
    res = await agent.get("/todos");
    csrfToken = extractCsrfToken(res);

    const response = await agent.put(`/todos/${latestTodo.id}`).send({
      _csrf: csrfToken,
      completed: false,
    });
    const parsedUpdateResponse = JSON.parse(response.text);
    console.log("sanket post parsedUpdateResponse:",parsedUpdateResponse)
    expect(parsedUpdateResponse.completed).toBe(false);
  });
  test("Create new todo", async () => {
    const agent = request.agent(server);
    await login(agent, "user.a@test.com", "12345678");
    const res = await agent.get("/todos");
    const csrfToken = extractCsrfToken(res);
    const response = await agent.post("/todos").send({
      title: "Go to movie",
      dueDate: new Date().toLocaleDateString("en-CA"),
      completed: false,
      _csrf: csrfToken,
    });
    await agent.get("/signout");
    expect(response.statusCode).toBe(302); //http status code
  });

  

  test(" Delete todo using ID", async () => {
    const agent = request.agent(server);
    await login(agent, "user.a@test.com", "12345678");
    let res = await agent.get("/todos");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "Go to shopping",
      dueDate: new Date().toLocaleDateString("en-CA"),
      completed: false,
      _csrf: csrfToken,
    });

    const gropuedTodosResponse = await agent
      .get("/todos")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(gropuedTodosResponse.text);
    const dueTodayCount = parsedGroupedResponse.dueToday.length;
    const latestTodo = parsedGroupedResponse.dueToday[dueTodayCount - 1];

    res = await agent.get("/todos");
    csrfToken = extractCsrfToken(res);

    const response = await agent.delete(`/todos/${latestTodo.id}`).send({
      _csrf: csrfToken,
    });
    const parsedUpdateResponse = JSON.parse(response.text);
    console.log("json response.text:",parsedUpdateResponse)
    expect(parsedUpdateResponse.success).toBe(true);
  });
  test("Check if User A can access User B's todos", async () => {
    const agent = request.agent(server);
    await login(agent, "user.a@test.com", "12345678");
    let res = await agent.get("/todos");
    let csrfToken = extractCsrfToken(res);

    await agent.post("/todos").send({
      title: "userA todo",
      dueDate: new Date().toLocaleDateString("en-CA"),
      completed: false, 
      _csrf: csrfToken,
    });

    const response = await agent
      .get("/todos")
      .set("Accept", "application/json");
    const parsedResponse = JSON.parse(response.text);
    console.log("parsedResponse ye hai:",parsedResponse)
    const dueTodayCount = parsedResponse.dueToday.length;
    const latestTodo = parsedResponse.dueToday[dueTodayCount - 1];
    globalTodoId = latestTodo;

    await logout(agent);
    await login(agent, "user.b@test.com", "123456789");
    res = await agent.get("/todos");
    csrfToken = extractCsrfToken(res);

    const accessResponse = await agent
      .get("/todos")
      .set("Accept", "application/json");
    const accessParsedResponse = JSON.parse(accessResponse.text);
    console.log("ye hai accessParsedResponse:",accessParsedResponse)
    const todo = accessParsedResponse;
    expect(todo.statusCode).toBe(undefined);
  });
  test("Check if User A can mark User B's todos as complete", async () => {
    const agent = request.agent(server);
    await login(agent, "user.b@test.com", "123456789");
    const todoID = globalTodoId;
    let res = await agent.get("/todos");
    let csrfToken = extractCsrfToken(res);

    const updateTodo = await agent.put(`/todos/${todoID.id}`).send({
      _csrf: csrfToken,
      completed: true,
    });
    console.log("this updateTodo is :",updateTodo)

    expect(updateTodo.accepted).toBe(false);
  });
  test("Check if User A can delete User B's todos", async () => {
    const agent = request.agent(server);
    await login(agent, "user.b@test.com", "123456789");
    const todoID = globalTodoId;

    let res = await agent.get("/todos");
    let csrfToken = extractCsrfToken(res);

    const deleteTodo = await agent.delete(`/todos/${todoID}`).send({
      _csrf: csrfToken,
    });

    expect(deleteTodo.statusCode).toBe(422);
  });
});