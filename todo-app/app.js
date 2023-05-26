/* eslint-disable */
/* eslint-disable no-undef */
const express = require("express"); //importing express
var csrf = require("tiny-csrf");
const app = express(); // creating new application
const bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
app.use(bodyParser.json());
const path = require("path");
const passport = require("passport");
const connectEnsureLogin = require("connect-ensure-login");
const session = require("express-session");
const LocalStrategy = require("passport-local");
const flash = require("connect-flash");
const bcrypt = require("bcrypt");

const saltRounds = 10;
app.set("views", path.join(__dirname, "views"));
app.use(flash());
const { Todo, User } = require("./models");
// eslint-disable-next-line no-unused-vars
const todo = require("./models/todo");
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: false }));
//SET EJS AS VIEW ENGINE
app.use(cookieParser("shh! some secrete string"));
app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));
app.set("view engine", "ejs");
app.use(
  session({
    secret: "my-super-secret-key-21728172615261562",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, //24hours
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(function (request, response, next) {
  response.locals.messages = request.flash();
  next();
});
// Passport Local Strategy
passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    (username, password, done) => {
      User.findOne({ where: { email: username } })
        .then(async function (user) {
          const result = await bcrypt.compare(password, user.password);
          if (result) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Invalid password" });
          }
        })
        .catch(() => {
          return done(null, false, {
            message: "Account doesn't exist for this mail",
          });
        });
    }
  )
);

passport.serializeUser(function (user, done) {
  console.log("Serializing user in session: ", user.id);
  done(null, user.id);
});
passport.deserializeUser(function (id, done) {
  User.findByPk(id)
    .then((user) => {
      done(null, user);
    })
    .catch((error) => {
      done(error, null);
    });
});
app.get("/signup", (request, response) => {
  response.render("signup", {
    title: "Signup",
    csrfToken: request.csrfToken(),
  });
});
app.get("/login", (request, response) => {
  response.render("login", { title: "Login", csrfToken: request.csrfToken() });
});
app.delete("/signout", function (req, res, next) {
  // need to implement signout behaviour here
});
app.get("/signout", function (request, response, next) {
  request.logout(function (err) {
    if (err) {
      return next(err);
    }
    response.redirect("/");
  });
});
app.post(
  "/session",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  function (request, response) {
    console.log(request.user);
    response.redirect("/todos");
  }
);
app.post("/users", async (request, response) => {
  try {
    const alreadyemail = await User.findOne({
      where: { email: request.body.email }
    });
    console.log("alreadyemail:", alreadyemail);

    const alreadyfname = await User.findOne({
      where: { firstName: request.body.firstName }
    });
    console.log("alreadyfname:", alreadyfname);

    const alreadylname = await User.findOne({
      where: { lastName: request.body.lastName }
    });
    console.log("alreadylname:", alreadylname);

    const alreadypassword = await User.findOne({
      where: { password: request.body.password }
    });
    console.log("alreadypassword:", alreadypassword);

    if (alreadyemail) {
      request.flash("error", "Email already registered. Please try logging in or use a different email.");
      return response.redirect("/signup");
    }

    if (alreadylname) {
      request.flash("error", "Last name already in use. Please choose a different last name.");
      return response.redirect("/signup");
    }

    if (alreadypassword) {
      request.flash("error", "Password already in use. Please choose a different password.");
      return response.redirect("/signup");
    }

    if (alreadyfname) {
      request.flash("error", "First name already in use. Please choose a different first name.");
      return response.redirect("/signup");
    }

    if (request.body.email.length === 0) {
      request.flash("error", "Email cannot be empty!");
      return response.redirect("/signup");
    }

    if (request.body.firstName.length === 0) {
      request.flash("error", "First name cannot be empty!");
      return response.redirect("/signup");
    }

    if (request.body.password.length < 8) {
      request.flash("error", "Password length should be a minimum of 8 characters.");
      return response.redirect("/signup");
    }

    const hashedPwd = await bcrypt.hash(request.body.password, saltRounds);
    console.log(hashedPwd);

    const user = await User.create({
      firstName: request.body.firstName,
      lastName: request.body.lastName,
      email: request.body.email,
      password: hashedPwd,
    });

    request.login(user, (err) => {
      if (err) {
        console.log(err);
      }
      response.redirect("/todos");
    });
  } catch (error) {
    console.log(error);
  }
});

app.use(express.static(path.join(__dirname, "public")));

app.get("/", async function (request, response) {
  response.render("index", {
    title: "Todo application",
    csrfToken: request.csrfToken(),
  });
});
/* eslint-disable-next-line no-undef */
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: false }));
/* eslint-disable-next-line no-unused-vars */
app.get(
  "/todos",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    // fot firstname of the login user
    const loggedInUser = request.user.id;
    const firstname = request.user.firstName;
      console.log("firstname:", firstname);
    const allTodos = await Todo.getTodos();
    const overdue = await Todo.overdue(loggedInUser);
    const dueLater = await Todo.dueLater(loggedInUser);
    const dueToday = await Todo.dueToday(loggedInUser);
    const completedItems = await Todo.completed_Items(loggedInUser);
    if (request.accepts("html")) {
      response.render("todos", {
        title: firstname,
        overdue,
        dueToday,
        dueLater,
        completedItems,
        csrfToken: request.csrfToken(),
      });
    } else {
      response.json({ overdue, dueToday, dueLater, completedItems });
    }
  }
);
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

app.post(
  "/todos",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    if (request.body.title.length == 0) {
      request.flash("error", "Title can not be empty!");
      return response.redirect("/todos");
    }
    if (request.body.dueDate.length == 0) {
      request.flash("error", "Due date can not be empty!");
      return response.redirect("/todos");
    }
    if (request.body.title.length < 5) {
      request.flash("error", "Title can not be less than 5!");
      return response.redirect("/todos");
    }
    console.log("creating new todo", request.body);
    try {
      // eslint-disable-next-line no-unused-vars
      await Todo.addTodo({
        title: request.body.title,
        dueDate: request.body.dueDate,
        completed: false,
        userId: request.user.id,
      });
      return response.redirect("/todos");
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);
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
    console.log("done wrong in backend");
    return response.status(422).json(error);
  }
});

module.exports = app;
