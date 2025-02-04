// Fetch elements
const todoForm = document.getElementById('todo-form');
const todoInput = document.querySelector('.todo-input');
const todoList = document.querySelector('.todo-list');
const loadMoreBtn = document.createElement('button');

// Set the initial page and limit for tasks
let currentPage = 1;
const itemsPerPage = 5;

document.addEventListener('DOMContentLoaded', () => {
    fetchTodos();
});

todoForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const taskText = todoInput.value.trim();
    if (taskText) {
        addTodoToDatabase(taskText);

        todoInput.value = '';
    }
});

// Function to add task to the table
function addTaskToTable(taskText, dateAdded, id, isDone) {
    const row = document.createElement('tr');
    const dateFormatted = new Date(dateAdded).toLocaleString();
    
    row.innerHTML = `
        <td class="${isDone ? 'done-task' : ''}">${taskText}</td>
        <td class="${isDone ? 'done-task' : ''}">${dateFormatted}</td>
        <td>
            <button class="action-btn edit-btn" data-id="${id}">Edit</button>
            <button class="action-btn delete-btn" data-id="${id}">Delete</button>
            <button class="action-btn done-btn" data-id="${id}">${isDone ? 'Undo' : 'Done'}</button>
        </td>
    `;

    const deleteBtn = row.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', () => {
        deleteTodoFromDatabase(deleteBtn.dataset.id);
        row.remove();
        checkLoadMoreButtonVisibility();
    });
    const editBtn = row.querySelector('.edit-btn');
    editBtn.addEventListener('click', () => {
        const newTaskText = prompt('Edit your task:', taskText);
        if (newTaskText) {
            updateTodoInDatabase(editBtn.dataset.id, newTaskText);
            row.querySelector('td:first-child').textContent = newTaskText;
        }
    });
    const doneBtn = row.querySelector('.done-btn');
    doneBtn.addEventListener('click', () => {
        toggleDoneStatus(doneBtn.dataset.id, doneBtn);
    });
    todoList.appendChild(row);
}

// Function to add a todo to the database via an API call
async function addTodoToDatabase(taskText) {
    try {
        const response = await fetch(`https://to-do-list-app-cnry.onrender.com/api/todos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                task: taskText,
            }),
        });

        if (response.ok) {
            const newTodo = await response.json();
            console.log('Todo added:', newTodo);
            addTaskToTable(newTodo.task, new Date(newTodo.date).toLocaleString(), newTodo._id, newTodo.done); // Add to UI with ID
            checkLoadMoreButtonVisibility();
        } else {
            console.error('Error adding todo to the database');
        }
    } catch (error) {
        console.error('Error connecting to the backend:', error);
    }
}

// Function to fetch todos from the database with pagination ?page=${currentPage}&limit=${itemsPerPage}
async function fetchTodos() {
    try {
        const response = await fetch(`https://to-do-list-app-cnry.onrender.com/api/todos?page=1&limit=1`);
        const todos = await response.json();

        if (currentPage === 1) { 
            todoList.innerHTML = '';
        }

        if (todos.length === 0 && currentPage === 1) {
            const noTasksRow = document.createElement('tr');
            noTasksRow.innerHTML = `<td colspan="3" style="text-align: center;">No tasks available</td>`;
            todoList.appendChild(noTasksRow);
        } else {
            todos.forEach(todo => {
                addTaskToTable(todo.task, new Date(todo.date).toLocaleString(), todo._id, todo.done);
            });

            checkLoadMoreButtonVisibility(todos.length);
        }
    } catch (error) {
        console.error('Error fetching todos:', error);
    }
}

// Function to delete todo from the database via an API call
async function deleteTodoFromDatabase(todoId) {
    try {
        const response = await fetch(`${process.env.BACKEND_API}/api/todos/${todoId}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            console.log('Todo deleted:', todoId);
        } else {
            console.error('Error deleting todo from the database');
        }
    } catch (error) {
        console.error('Error connecting to the backend:', error);
    }
}

// Function to update todo in the database via an API call
async function updateTodoInDatabase(todoId, newTaskText) {
    try {
        const response = await fetch(`${process.env.BACKEND_API}/api/todos/${todoId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                task: newTaskText,
            }),
        });

        if (response.ok) {
            const updatedTodo = await response.json();
            console.log('Todo updated:', updatedTodo);
        } else {
            console.error('Error updating todo in the database');
        }
    } catch (error) {
        console.error('Error connecting to the backend:', error);
    }
}

// Function to toggle the "done" status of a todo item
async function toggleDoneStatus(todoId, button) {
    try {
        const response = await fetch(`${process.env.BACKEND_API}/api/todos/${todoId}/done`, {
            method: 'PUT',
        });

        if (response.ok) {
            const updatedTodo = await response.json();
            const taskText = document.querySelector(`[data-id='${todoId}']`).closest('tr').querySelector('td:first-child');
            const taskDate = document.querySelector(`[data-id='${todoId}']`).closest('tr').querySelector('td:nth-child(2)');

            if (updatedTodo.done) {
                taskText.classList.add('done-task');
                taskDate.classList.add('done-task');
                button.textContent = 'Undo';
            } else {
                taskText.classList.remove('done-task');
                taskDate.classList.remove('done-task');
                button.textContent = 'Done';
            }
        }
    } catch (error) {
        console.error('Error toggling done status:', error);
    }
}

// Function to check if the "Load More" button should be shown or hidden
function checkLoadMoreButtonVisibility(todosFetched = 0) {
    const rows = document.querySelectorAll('#todo-table tbody tr');

    if (rows.length >= itemsPerPage && todosFetched >= itemsPerPage) {
        if (!document.body.contains(loadMoreBtn)) {
            loadMoreBtn.textContent = 'Load More';
            loadMoreBtn.classList.add('load-more-btn');
            loadMoreBtn.addEventListener('click', () => {
                currentPage++;
                fetchTodos();
            });
            document.body.appendChild(loadMoreBtn);
        }
    } else {
        if (document.body.contains(loadMoreBtn)) {
            loadMoreBtn.remove();
        }
    }
}
