const {connect} = require("./connectDB.js");
const Todo = require("./TodoModel.js");

const createTodo = async() => {
  try{
    await connect();
    const todo = await Todo.addTask({
      title:"third Item",
      dueDate:new Date (),
      completed:false,
    });
    console.log(`created todo with ID : ${todo.id}`);
  }catch (error){
    console.error(error);
  }
};
const countItem = async() =>{
  try{
    const totalCount = await Todo.count();
    console.log(`found ${totalCount} item in the table`);
  }catch(error){
    console.error(error);
  }
}
const getalltodos = async() =>{
  try{
    const find = await Todo.findAll();
    const todolist = find.map(todo=>todo.displayableString()).join("\n");
    console.log(todolist)
  }catch(error){
    console.error(error)
  }
}
( async() => {
  await createTodo();
  await countItem();
  await getalltodos();
}) ();