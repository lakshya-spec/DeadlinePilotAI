// ===============================
// DeadlinePilot AI - Main Logic
// ===============================

// Get important HTML elements
const taskModal = document.getElementById("taskModal");
const taskForm = document.getElementById("taskForm");
const closeTaskModal = document.getElementById("closeTaskModal");

const taskTitle = document.getElementById("taskTitle");
const taskDeadline = document.getElementById("taskDeadline");
const taskHours = document.getElementById("taskHours");
const taskImportance = document.getElementById("taskImportance");
const taskCategory = document.getElementById("taskCategory");

// These buttons already exist on your page
const addTaskButtons = document.querySelectorAll(
  ".add-task-button, .add-task-btn, .primary-button"
);

// Load saved tasks from browser storage
let tasks = JSON.parse(localStorage.getItem("deadlinePilotTasks")) || [];

// Open the Add Task popup
function openTaskModal() {
  taskModal.classList.remove("hidden");
}

// Close the Add Task popup
function closeModal() {
  taskModal.classList.add("hidden");
  taskForm.reset();
}

// Attach click event to all possible Add Task buttons
addTaskButtons.forEach((button) => {
  button.addEventListener("click", openTaskModal);
});

// Close popup using X button
closeTaskModal.addEventListener("click", closeModal);

// Close popup when clicking outside the white modal box
taskModal.addEventListener("click", (event) => {
  if (event.target === taskModal) {
    closeModal();
  }
});

// Calculate task risk based on deadline, hours and importance
function calculateRisk(deadline, hours, importance) {
  const now = new Date();
  const dueDate = new Date(deadline);

  const hoursLeft = (dueDate - now) / (1000 * 60 * 60);

  let score = 0;

  if (hoursLeft < 24) score += 3;
  else if (hoursLeft < 72) score += 2;
  else if (hoursLeft < 168) score += 1;

  if (Number(hours) >= 8) score += 2;
  else if (Number(hours) >= 4) score += 1;

  if (importance === "high") score += 2;
  else if (importance === "medium") score += 1;

  if (score >= 4) return "High";
  if (score >= 2) return "Medium";
  return "Low";
}

// Save a new task when the form is submitted
taskForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const newTask = {
    id: Date.now(),
    title: taskTitle.value,
    deadline: taskDeadline.value,
    hours: taskHours.value,
    importance: taskImportance.value,
    category: taskCategory.value,
    completed: false,
  };

  newTask.risk = calculateRisk(
    newTask.deadline,
    newTask.hours,
    newTask.importance
  );

  tasks.push(newTask);

  // Save tasks permanently in this browser
  localStorage.setItem("deadlinePilotTasks", JSON.stringify(tasks));

  closeModal();
  renderTasks();
  updateDashboard();
});

// Show tasks on the page
function renderTasks() {
  const taskList = document.querySelector(".task-list, .tasks-list, .mission-list");

  if (!taskList) {
    console.log("Task list container not found yet.");
    return;
  }

  if (tasks.length === 0) {
    taskList.innerHTML = `
      <div class="empty-state">
        <p>No missions added yet.</p>
        <p>Add your first deadline and DeadlinePilot will assess the risk.</p>
      </div>
    `;
    return;
  }

  taskList.innerHTML = tasks
    .map(
      (task) => `
      <div class="task-card">
        <div>
          <h3>${task.title}</h3>
          <p>${task.category} • ${task.hours} hour(s)</p>
          <p>Deadline: ${new Date(task.deadline).toLocaleString()}</p>
        </div>

        <div>
          <span class="risk-badge risk-${task.risk.toLowerCase()}">
            ${task.risk} Risk
          </span>

          <button class="complete-task-btn" data-id="${task.id}">
            ${task.completed ? "Completed ✓" : "Mark Complete"}
          </button>
        </div>
      </div>
    `
    )
    .join("");

  // Mark task complete
  document.querySelectorAll(".complete-task-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const taskId = Number(button.dataset.id);

      tasks = tasks.map((task) => {
        if (task.id === taskId) {
          task.completed = !task.completed;
        }
        return task;
      });

      localStorage.setItem("deadlinePilotTasks", JSON.stringify(tasks));
      renderTasks();
      updateDashboard();
    });
  });
}

// Update top dashboard cards
function updateDashboard() {
  const dueToday = tasks.filter((task) => {
    const deadlineDate = new Date(task.deadline).toDateString();
    const today = new Date().toDateString();

    return deadlineDate === today && !task.completed;
  }).length;

  const atRisk = tasks.filter(
    (task) => task.risk === "High" && !task.completed
  ).length;

  const completed = tasks.filter((task) => task.completed).length;

const dueTodayCard = document.getElementById("due-Today-Count");
const atRiskCard = document.getElementById("at-Risk-Count");
const completedCard = document.getElementById("completed-Count");

  if (dueTodayCard) dueTodayCard.textContent = dueToday;
  if (atRiskCard) atRiskCard.textContent = atRisk;
  if (completedCard) completedCard.textContent = completed;
  const addTaskButton = document.querySelector(".add-task-button");
  if (addTaskButton) {
  addTaskButton.textContent =
    tasks.length === 0 ? "Add your first task" : "Add another task";
}


}

// Run when page loads
renderTasks();
updateDashboard();
const generatePlanButton = document.getElementById("generatePlanButton");

if (generatePlanButton) {
  generatePlanButton.addEventListener("click", () => {
    const pendingTasks = tasks.filter((task) => !task.completed);

    if (pendingTasks.length === 0) {
      alert("Add a task first so DeadlinePilot can create your plan.");
      return;
    }

    const riskScore = {
      High: 3,
      Medium: 2,
      Low: 1
    };

    const sortedTasks = [...pendingTasks].sort((a, b) => {
      if (riskScore[b.risk] !== riskScore[a.risk]) {
        return riskScore[b.risk] - riskScore[a.risk];
      }

      return new Date(a.deadline) - new Date(b.deadline);
    });

    const nextTask = sortedTasks[0];

    alert(
      "YOUR NEXT BEST ACTION:\n\n" +
      nextTask.title + "\n" +
      "Risk: " + nextTask.risk + "\n" +
      "Estimated focus time: " + nextTask.hours + " hour(s)\n\n" +
      "Start with this task first."
    );
  });
}