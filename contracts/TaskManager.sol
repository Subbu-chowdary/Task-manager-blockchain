// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TaskManager {
    struct Task {
        uint taskId;
        string title;
        string description;
        bool status;
        address owner;
        uint timestamp;
    }

    mapping(uint => Task) public tasks;
    mapping(address => uint[]) public userTasks;
    uint public taskCount;

    event TaskCreated(uint taskId, string title, address owner);
    event TaskUpdated(uint taskId, bool status);
    event TaskDeleted(uint taskId);

    function createTask(string memory _title, string memory _description) public {
        taskCount++;
        tasks[taskCount] = Task(taskCount, _title, _description, false, msg.sender, block.timestamp);
        userTasks[msg.sender].push(taskCount);
        emit TaskCreated(taskCount, _title, msg.sender);
    }

    function updateTask(uint _taskId, string memory _title, string memory _description, bool _status) public {
        require(tasks[_taskId].owner == msg.sender, "Not the task owner");
        tasks[_taskId].title = _title;
        tasks[_taskId].description = _description;
        tasks[_taskId].status = _status;
        emit TaskUpdated(_taskId, _status);
    }

    function deleteTask(uint _taskId) public {
        require(tasks[_taskId].owner == msg.sender, "Not the task owner");
        delete tasks[_taskId];
        emit TaskDeleted(_taskId);
    }

    // Temporary debug function to return all tasks (not just the caller's)
    function getAllTasks() public view returns (Task[] memory) {
        uint totalTasks = taskCount;
        Task[] memory allTasks = new Task[](totalTasks);
        uint validCount = 0;
        for (uint i = 1; i <= totalTasks; i++) {
            if (tasks[i].owner != address(0)) {
                allTasks[validCount] = tasks[i];
                validCount++;
            }
        }
        // Resize array to remove unused elements
        assembly {
            mstore(allTasks, validCount)
        }
        return allTasks;
    }

    // Original function to get tasks for the caller
    function getTasks() public view returns (Task[] memory) {
        uint[] memory userTaskIds = userTasks[msg.sender];
        uint validCount = 0;
        for (uint i = 0; i < userTaskIds.length; i++) {
            if (tasks[userTaskIds[i]].owner != address(0)) {
                validCount++;
            }
        }
        Task[] memory userTasksList = new Task[](validCount);
        uint index = 0;
        for (uint i = 0; i < userTaskIds.length; i++) {
            if (tasks[userTaskIds[i]].owner != address(0)) {
                userTasksList[index] = tasks[userTaskIds[i]];
                index++;
            }
        }
        return userTasksList;
    }

    // New function to inspect userTasks for debugging
    function getUserTaskIds(address _user) public view returns (uint[] memory) {
        return userTasks[_user];
    }
}