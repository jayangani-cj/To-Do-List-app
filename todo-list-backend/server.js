const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/todo-list', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.log(err));

// Schema for Todo item
const todoSchema = new mongoose.Schema({
    task: String,
    done: { type: Boolean, default: false },
    date: { type: Date, default: Date.now },
});

const Todo = mongoose.model("Todo", todoSchema);

// API Routes

// POST: Add a new todo
app.post("/api/todos", async (req, res) => {
    try {
        const { task } = req.body;
        const newTodo = new Todo({
            task,
        });
        await newTodo.save();
        res.status(201).json(newTodo);
    } catch (err) {
        res.status(500).json({ message: "Error creating todo", error: err });
    }
});

// GET: Fetch all todos with pagination
app.get('/api/todos', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    try {
        const todos = await Todo.find().skip(skip).limit(limit);
        res.json(todos);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching todos', error: err });
    }
});

// DELETE: Delete a todo by ID
app.delete("/api/todos/:id", async (req, res) => {
    try {
        const todoId = req.params.id;
        await Todo.findByIdAndDelete(todoId);
        res.status(200).json({ message: "Todo deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Error deleting todo", error: err });
    }
});

// PUT: Edit a todo by ID (e.g., to update the task)
app.put("/api/todos/:id", async (req, res) => {
    try {
        const todoId = req.params.id;
        const { task } = req.body;
        const updatedTodo = await Todo.findByIdAndUpdate(
            todoId,
            { task },
            { new: true }
        );
        res.status(200).json(updatedTodo);
    } catch (err) {
        res.status(500).json({ message: "Error updating todo", error: err });
    }
});

// PUT: Toggle the "done" status of a todo item
app.put("/api/todos/:id/done", async (req, res) => {
    try {
        const todoId = req.params.id;
        const todo = await Todo.findById(todoId);

        if (!todo) {
            return res.status(404).json({ message: "Todo not found" });
        }
        todo.done = !todo.done;
        await todo.save();

        res.status(200).json(todo);
    } catch (err) {
        res.status(500).json({ message: "Error toggling 'done' status", error: err });
    }
});

// Start server
const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
