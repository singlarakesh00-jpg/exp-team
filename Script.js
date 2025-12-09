$(document).ready(function() {
    // Initialize data
    let lists = JSON.parse(localStorage.getItem('trelloData')) || [
        {
            id: 1,
            title: 'To Do',
            cards: [
                {
                    id: 101,
                    title: 'Design Homepage Mockup',
                    description: 'Create wireframes and mockups for homepage redesign',
                    labels: ['Design'],
                    assignee: 'alice',
                    dueDate: '2024-06-15',
                    comments: 3
                },
                {
                    id: 102,
                    title: 'Setup Project Repository',
                    description: 'Initialize Git repo and setup project structure',
                    labels: ['Backend'],
                    assignee: 'john',
                    dueDate: '2024-06-10',
                    comments: 1
                }
            ]
        },
        {
            id: 2,
            title: 'In Progress',
            cards: [
                {
                    id: 201,
                    title: 'Implement User Authentication',
                    description: 'Setup JWT auth and user management',
                    labels: ['Backend', 'Feature'],
                    assignee: 'mike',
                    dueDate: '2024-06-20',
                    comments: 5
                }
            ]
        },
        {
            id: 3,
            title: 'Review',
            cards: [
                {
                    id: 301,
                    title: 'Code Review: Payment Integration',
                    description: 'Review the Stripe payment integration code',
                    labels: ['Backend'],
                    assignee: 'kate',
                    dueDate: '2024-06-12',
                    comments: 2
                }
            ]
        },
        {
            id: 4,
            title: 'Done',
            cards: [
                {
                    id: 401,
                    title: 'Project Planning & Requirements',
                    description: 'Completed project planning phase',
                    labels: ['Feature'],
                    assignee: 'john',
                    dueDate: '2024-06-05',
                    comments: 0
                }
            ]
        }
    ];

    let currentListId = null;
    let draggedCard = null;
    let draggedFromList = null;

    // DOM Elements
    const board = $('#board');
    const addListForm = $('#addListForm');
    const addListBtn = $('#addListBtn');
    const saveListBtn = $('#saveListBtn');
    const cancelListBtn = $('#cancelListBtn');
    const listTitleInput = $('#listTitleInput');
    const cardModal = $('#cardModal');
    const closeCardModal = $('#closeCardModal');
    const cancelCardBtn = $('#cancelCardBtn');
    const saveCardBtn = $('#saveCardBtn');
    const cardTitle = $('#cardTitle');
    const cardDescription = $('#cardDescription');
    const cardAssignee = $('#cardAssignee');
    const cardDueDate = $('#cardDueDate');

    // Initialize the board
    function initBoard() {
        board.empty();
        lists.forEach(list => {
            const listElement = createListElement(list);
            board.append(listElement);
        });
        
        // Add "Add List" button
        const addListButton = $(`
            <div class="add-list-btn" id="addListButton">
                <button class="add-card-btn" id="showAddListForm">
                    <i class="fas fa-plus"></i> Add another list
                </button>
            </div>
        `);
        board.append(addListButton);
        
        $('#showAddListForm').on('click', showAddListForm);
        addDragAndDropListeners();
        saveToLocalStorage();
    }

    // Create list element
    function createListElement(list) {
        const listElement = $(`
            <div class="list" data-list-id="${list.id}">
                <div class="list-header">
                    <h3 class="list-title" contenteditable="true">${list.title}</h3>
                    <div class="list-actions">
                        <button class="list-action-btn" title="Add card" data-action="add-card">
                            <i class="fas fa-plus"></i>
                        </button>
                        <button class="list-action-btn" title="Delete list" data-action="delete-list">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="cards-container" data-list-id="${list.id}">
                    ${list.cards.map(card => createCardElement(card)).join('')}
                </div>
                <button class="add-card-btn" data-list-id="${list.id}">
                    <i class="fas fa-plus"></i> Add a card
                </button>
            </div>
        `);

        // Add event listeners
        listElement.find('.list-title').on('blur', function() {
            updateListTitle(list.id, $(this).text());
        });

        listElement.find('[data-action="add-card"], .add-card-btn').on('click', function() {
            showCardModal(list.id);
        });

        listElement.find('[data-action="delete-list"]').on('click', function() {
            deleteList(list.id);
        });

        return listElement;
    }

    // Create card element
    function createCardElement(card) {
        const assigneeInitials = {
            'john': 'JD',
            'alice': 'AS',
            'mike': 'MJ',
            'kate': 'KW',
            'unassigned': '?'
        };

        const labelColors = {
            'Frontend': '#61bd4f',
            'Backend': '#f2d600',
            'Design': '#ff9f1a',
            'Bug': '#eb5a46',
            'Feature': '#c377e0'
        };

        const labels = card.labels.map(label => `
            <span class="card-label" style="background-color: ${labelColors[label] || '#61bd4f'}">
                ${label}
            </span>
        `).join('');

        return `
            <div class="card" draggable="true" data-card-id="${card.id}">
                <div class="card-header">
                    <div class="card-title">${card.title}</div>
                    <div class="card-actions">
                        <button class="list-action-btn" data-action="delete-card">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                ${card.description ? `<div class="card-description">${card.description}</div>` : ''}
                ${labels ? `<div class="card-labels">${labels}</div>` : ''}
                <div class="card-footer">
                    <div class="card-meta">
                        ${card.dueDate ? `
                            <div class="card-meta-item">
                                <i class="far fa-calendar"></i>
                                ${new Date(card.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </div>
                        ` : ''}
                        ${card.comments > 0 ? `
                            <div class="card-meta-item">
                                <i class="far fa-comment"></i>
                                ${card.comments}
                            </div>
                        ` : ''}
                    </div>
                    <div class="card-assignee" style="background-color: ${getAssigneeColor(card.assignee)}">
                        ${assigneeInitials[card.assignee] || '?'}
                    </div>
                </div>
            </div>
        `;
    }

    // Get assignee color
    function getAssigneeColor(assignee) {
        const colors = {
            'john': '#3498db',
            'alice': '#2ecc71',
            'mike': '#e74c3c',
            'kate': '#f39c12',
            'unassigned': '#95a5a6'
        };
        return colors[assignee] || '#95a5a6';
    }

    // Show add list form
    function showAddListForm() {
        addListForm.show();
        $('#addListButton').hide();
        listTitleInput.focus();
    }

    // Hide add list form
    function hideAddListForm() {
        addListForm.hide();
        $('#addListButton').show();
        listTitleInput.val('');
    }

    // Add new list
    function addList(title) {
        const newList = {
            id: Date.now(),
            title: title,
            cards: []
        };
        lists.push(newList);
        initBoard();
    }

    // Update list title
    function updateListTitle(listId, newTitle) {
        const list = lists.find(l => l.id === listId);
        if (list && newTitle.trim()) {
            list.title = newTitle.trim();
            saveToLocalStorage();
        }
    }

    // Delete list
    function deleteList(listId) {
        if (confirm('Are you sure you want to delete this list and all its cards?')) {
            lists = lists.filter(l => l.id !== listId);
            initBoard();
        }
    }

    // Show card modal
    function showCardModal(listId) {
        currentListId = listId;
        cardTitle.val('');
        cardDescription.val('');
        cardAssignee.val('unassigned');
        cardDueDate.val('');
        cardModal.addClass('show');
    }

    // Hide card modal
    function hideCardModal() {
        cardModal.removeClass('show');
        currentListId = null;
    }

    // Add new card
    function addCard(listId, cardData) {
        const list = lists.find(l => l.id === listId);
        if (list) {
            const newCard = {
                id: Date.now(),
                title: cardData.title,
                description: cardData.description,
                labels: cardData.labels || [],
                assignee: cardData.assignee,
                dueDate: cardData.dueDate,
                comments: 0
            };
            list.cards.push(newCard);
            initBoard();
        }
    }

    // Delete card
    function deleteCard(cardId) {
        lists.forEach(list => {
            list.cards = list.cards.filter(card => card.id !== cardId);
        });
        initBoard();
    }

    // Drag and Drop functionality
    function addDragAndDropListeners() {
        // Card drag start
        $('.card').on('dragstart', function(e) {
            draggedCard = $(this);
            draggedFromList = $(this).closest('.list').data('list-id');
            setTimeout(() => {
                $(this).addClass('dragging');
            }, 0);
        });

        // Card drag end
        $('.card').on('dragend', function() {
            $(this).removeClass('dragging');
            $('.list').removeClass('drop-zone');
            draggedCard = null;
            draggedFromList = null;
        });

        // List drag over
        $('.list').on('dragover', function(e) {
            e.preventDefault();
            $(this).addClass('drop-zone');
        });

        // List drag leave
        $('.list').on('dragleave', function() {
            $(this).removeClass('drop-zone');
        });

        // List drop
        $('.list').on('drop', function(e) {
            e.preventDefault();
            $(this).removeClass('drop-zone');
            
            if (draggedCard && draggedFromList) {
                const toListId = $(this).data('list-id');
                const cardId = parseInt(draggedCard.data('card-id'));
                
                moveCard(cardId, draggedFromList, toListId);
            }
        });

        // Card click events (delegation)
        board.on('click', '[data-action="delete-card"]', function(e) {
            e.stopPropagation();
            const cardId = parseInt($(this).closest('.card').data('card-id'));
            if (confirm('Are you sure you want to delete this card?')) {
                deleteCard(cardId);
            }
        });
    }

    // Move card between lists
    function moveCard(cardId, fromListId, toListId) {
        let cardToMove = null;
        
        // Find and remove card from source list
        lists.forEach(list => {
            if (list.id === fromListId) {
                const cardIndex = list.cards.findIndex(card => card.id === cardId);
                if (cardIndex > -1) {
                    cardToMove = list.cards.splice(cardIndex, 1)[0];
                }
            }
        });
        
        // Add card to target list
        if (cardToMove) {
            lists.forEach(list => {
                if (list.id === toListId) {
                    list.cards.push(cardToMove);
                }
            });
            initBoard();
        }
    }

    // Save to localStorage
    function saveToLocalStorage() {
        localStorage.setItem('trelloData', JSON.stringify(lists));
    }

    // Event Listeners
    addListBtn.on('click', showAddListForm);
    
    saveListBtn.on('click', function() {
        const title = listTitleInput.val().trim();
        if (title) {
            addList(title);
            hideAddListForm();
        }
    });
    
    cancelListBtn.on('click', hideAddListForm);
    
    listTitleInput.on('keypress', function(e) {
        if (e.which === 13) { // Enter key
            saveListBtn.click();
        }
    });

    // Label selection
    $('.label-option').on('click', function() {
        $(this).toggleClass('selected');
    });

    // Card modal events
    closeCardModal.on('click', hideCardModal);
    cancelCardBtn.on('click', hideCardModal);
    
    saveCardBtn.on('click', function() {
        const selectedLabels = [];
        $('.label-option.selected').each(function() {
            selectedLabels.push($(this).text());
        });

        const cardData = {
            title: cardTitle.val().trim(),
            description: cardDescription.val().trim(),
            labels: selectedLabels,
            assignee: cardAssignee.val(),
            dueDate: cardDueDate.val()
        };

        if (cardData.title) {
            addCard(currentListId, cardData);
            hideCardModal();
        } else {
            alert('Please enter a card title');
        }
    });

    // Initialize the board
    initBoard();

    // Keyboard shortcuts
    $(document).on('keydown', function(e) {
        // Escape to close modals
        if (e.key === 'Escape') {
            if (cardModal.hasClass('show')) {
                hideCardModal();
            }
            if (addListForm.is(':visible')) {
                hideAddListForm();
            }
        }
        
        // Ctrl+N to add new list
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            showAddListForm();
        }
    });

    // Demo: Simulate real-time updates
    setInterval(function() {
        const randomList = lists[Math.floor(Math.random() * lists.length)];
        if (randomList && randomList.cards.length > 0) {
            const randomCard = randomList.cards[Math.floor(Math.random() * randomList.cards.length)];
            if (randomCard) {
                randomCard.comments += Math.floor(Math.random() * 2);
                saveToLocalStorage();
            }
        }
    }, 30000); // Update every 30 seconds
});