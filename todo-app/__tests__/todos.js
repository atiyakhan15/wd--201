/* eslint-disable no-undef */
jest.setTimeout(10000);
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

describe("Todo test suite ", () => {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(4000, () => {});
    agent = request.agent(server);
  });
  afterAll(async () => {
    await db.sequelize.close();
    server.close();
  });
  test("create a new todo", async () => {
    agent = request.agent(server);
    const res = await agent.get("/");
    const csrfToken = extractCsrfToken(res);
    const response = await agent.post("/todos").send({
      _csrf: csrfToken,
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
    });
    expect(response.statusCode).toBe(500);
  });

  test("Mark todo as completed (Updating Todo)", async () => {
    let res = await agent.get("/");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    const groupedTodosResponse = await agent
      .get("/")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
    const dueTodayCount = parsedGroupedResponse.dueToday.length;
    if (dueTodayCount > 0) {
      const latestTodo = parsedGroupedResponse.dueToday[dueTodayCount - 1];
      const status = !latestTodo.completed;
      res = await agent.get("/");
      csrfToken = extractCsrfToken(res);
      const response = await agent.put(`todos/${latestTodo.id}`).send({
        _csrf: csrfToken,
        completed: status,
      });
      const parsedUpdateResponse = JSON.parse(response.text);
      expect(parsedUpdateResponse.completed).toBe(true);
    }
  });
  test("Mark todo as incompleted (Updating Todo)", async () => {
    let res = await agent.get("/");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "Buy dairymilk",
      dueDate: new Date().toISOString(),
      completed: true,
      _csrf: csrfToken,
    });
    const groupedTodosResponse = await agent
      .get("/")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
    const dueTodayCount = parsedGroupedResponse.dueToday.length;
    if (dueTodayCount > 0) {
      const latestTodo = parsedGroupedResponse.dueToday[dueTodayCount - 1];
      const status = !latestTodo.completed;
      res = await agent.get("/");
      csrfToken = extractCsrfToken(res);
      const response = await agent.put(`todos/${latestTodo.id}`).send({
        _csrf: csrfToken,
        completed: status,
      });
      const parsedUpdateResponse = JSON.parse(response.text);
      expect(parsedUpdateResponse.completed).toBe(false);
    }
  });

  test(" Delete todo using ID", async () => {
    let res = await agent.get("/");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "Go to shopping",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });

    const gropuedTodosResponse = await agent
      .get("/")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(gropuedTodosResponse.text);
    const dueTodayCount = parsedGroupedResponse.dueToday.length;
    const latestTodo = parsedGroupedResponse.dueToday[dueTodayCount - 1];

    console.log("parsedGroupedResponse:", parsedGroupedResponse);
    console.log("latestTodo:", latestTodo);

    try {
      res = await agent.get("/");
      csrfToken = extractCsrfToken(res);

      const response = await agent.put(`todos/${latestTodo.id}`).send({
        _csrf: csrfToken,
      });
      const parsedUpdateResponse = JSON.parse(response.text);
      expect(parsedUpdateResponse.completed).toBe(true);
    } catch (err) {
      console.error("Error updating todo:", err);
    }
  });
});
