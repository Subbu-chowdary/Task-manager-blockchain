const { expect } = require("chai");

describe("TaskManager", function () {
  let TaskManager, taskManager, owner, addr1;

  beforeEach(async function () {
    TaskManager = await ethers.getContractFactory("TaskManager");
    [owner, addr1] = await ethers.getSigners();
    taskManager = await TaskManager.deploy();
    await taskManager.deployed();
  });

  it("Should create a task", async function () {
    await taskManager.createTask("Task 1", "Description 1");
    const task = await taskManager.tasks(1);
    expect(task.title).to.equal("Task 1");
    expect(task.owner).to.equal(owner.address);
  });

  it("Should update a task", async function () {
    await taskManager.createTask("Task 1", "Description 1");
    await taskManager.updateTask(1, "Updated Task", "Updated Desc", true);
    const task = await taskManager.tasks(1);
    expect(task.title).to.equal("Updated Task");
    expect(task.status).to.be.true;
  });

  it("Should delete a task and filter from getTasks", async function () {
    await taskManager.createTask("Task 1", "Description 1");
    await taskManager.createTask("Task 2", "Description 2");
    await taskManager.deleteTask(1);
    const tasks = await taskManager.getTasks();
    expect(tasks.length).to.equal(1);
    expect(tasks[0].title).to.equal("Task 2");
  });

  it("Should restrict updates to owner", async function () {
    await taskManager.createTask("Task 1", "Description 1");
    await expect(
      taskManager.connect(addr1).updateTask(1, "Hack", "Hack", true)
    ).to.be.revertedWith("Not the task owner");
  });
});
