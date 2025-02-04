require("dotenv").config(); // Load environment variables
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect(`mongodb+srv://cj2004:cj@123@cluster0.xlodv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0/todo-list`)
    .then(() => console.log("✅ MongoDB connected"))
    .catch(err => console.log("❌ MongoDB connection error:", err));

// Define Todo Schema & Model
const todoSchema = new mongoose.Schema({
    task: { type: String, required: true },
    done: { type: Boolean, default: false },
    date: { type: Date, default: Date.now },
});

const Todo = mongoose.model("Todo", todoSchema);

// 🚀 API Routes

// 📝 Create a new Todo
app.post("/api/todos", async (req, res) => {
    try {
        const { task } = req.body;
        if (!task) return res.status(400).json({ message: "Task is required" });

        const newTodo = new Todo({ task });
        await newTodo.save();
        res.status(201).json(newTodo);
    } catch (err) {
        res.status(500).json({ message: "Error creating todo", error: err.message });
    }
});

// 📋 Fetch all Todos with Pagination
app.get("/api/todos", async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    try {
        const todos = await Todo.find().skip(skip).limit(limit);
        const totalTodos = await Todo.countDocuments();

        res.json({ todos, totalPages: Math.ceil(totalTodos / limit), currentPage: page });
    } catch (err) {
        res.status(500).json({ message: "Error fetching todos", error: err.message });
    }
});

// ❌ Delete a Todo by ID
app.delete("/api/todos/:id", async (req, res) => {
    try {
        const todo = await Todo.findByIdAndDelete(req.params.id);
        if (!todo) return res.status(404).json({ message: "Todo not found" });

        res.status(200).json({ message: "Todo deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Error deleting todo", error: err.message });
    }
});

// ✏️ Update a Todo's Task
app.put("/api/todos/:id", async (req, res) => {
    try {
        const { task } = req.body;
        if (!task) return res.status(400).json({ message: "Task is required" });

        const updatedTodo = await Todo.findByIdAndUpdate(
            req.params.id,
            { task },
            { new: true }
        );

        if (!updatedTodo) return res.status(404).json({ message: "Todo not found" });

        res.status(200).json(updatedTodo);
    } catch (err) {
        res.status(500).json({ message: "Error updating todo", error: err.message });
    }
});

// ✅ Toggle a Todo's Done Status
app.put("/api/todos/:id/done", async (req, res) => {
    try {
        const todo = await Todo.findById(req.params.id);
        if (!todo) return res.status(404).json({ message: "Todo not found" });

        todo.done = !todo.done;
        await todo.save();

        res.status(200).json(todo);
    } catch (err) {
        res.status(500).json({ message: "Error toggling 'done' status", error: err.message });
    }
});

// 🌍 Start Server
const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
});
