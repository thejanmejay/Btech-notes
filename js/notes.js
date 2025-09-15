// Notes page functionality for B.Tech Notes Hub

let notesData = {};
let currentFilters = {
    branch: '',
    year: '',
    semester: '',
    subject: ''
};

// DOM elements
let branchSelect, yearSelect, semesterSelect, subjectSelect;
let clearFiltersBtn, searchNotesBtn;
let loadingState, emptyState, noResults, notesGrid;
let resultsCount, noteModal;

// Initialize notes page
document.addEventListener('DOMContentLoaded', function() {
    initializeElements();
    loadNotesData();
    initializeFilters();
    initializeModal();
    initializeSuggestions();
    
    // Check for URL parameters
    checkURLParameters();
});

function initializeElements() {
    // Filter elements
    branchSelect = document.getElementById('branch-select');
    yearSelect = document.getElementById('year-select');
    semesterSelect = document.getElementById('semester-select');
    subjectSelect = document.getElementById('subject-select');
    
    // Button elements
    clearFiltersBtn = document.getElementById('clear-filters');
    searchNotesBtn = document.getElementById('search-notes');
    
    // State elements
    loadingState = document.getElementById('loading-state');
    emptyState = document.getElementById('empty-state');
    noResults = document.getElementById('no-results');
    notesGrid = document.getElementById('notes-grid');
    resultsCount = document.getElementById('results-count');
    
    // Modal
    noteModal = document.getElementById('note-modal');
}

async function loadNotesData() {
    try {
        showLoadingState();
        
        // In a real application, this would be an API call
        const response = await fetch('data/notes.json');
        if (!response.ok) {
            throw new Error('Failed to load notes data');
        }
        
        notesData = await response.json();
        hideLoadingState();
        
        // Populate branch options
        populateBranchOptions();
        
    } catch (error) {
        console.error('Error loading notes data:', error);
        hideLoadingState();
        BTechNotesHub.showNotification('Failed to load notes data. Please refresh the page.', 'error');
    }
}

function populateBranchOptions() {
    if (!branchSelect) return;
    
    // Clear existing options except the first one
    branchSelect.innerHTML = '<option value="">Select Branch</option>';
    
    // Add options from data
    Object.keys(notesData).forEach(branch => {
        const option = document.createElement('option');
        option.value = branch;
        option.textContent = getBranchFullName(branch);
        branchSelect.appendChild(option);
    });
}

function getBranchFullName(branch) {
    const branchNames = {
        'CSE': 'Computer Science & Engineering',
        'ECE': 'Electronics & Communication',
        'MECH': 'Mechanical Engineering',
        'CIVIL': 'Civil Engineering',
        'EEE': 'Electrical & Electronics',
        'IT': 'Information Technology'
    };
    return branchNames[branch] || branch;
}

function initializeFilters() {
    if (!branchSelect) return;
    
    // Branch change handler
    branchSelect.addEventListener('change', function() {
        currentFilters.branch = this.value;
        resetDependentFilters(['year', 'semester', 'subject']);
        
        if (this.value) {
            populateYearOptions();
            yearSelect.disabled = false;
        } else {
            yearSelect.disabled = true;
            semesterSelect.disabled = true;
            subjectSelect.disabled = true;
        }
        
        updateResults();
    });
    
    // Year change handler
    yearSelect.addEventListener('change', function() {
        currentFilters.year = this.value;
        resetDependentFilters(['semester', 'subject']);
        
        if (this.value && currentFilters.branch) {
            populateSemesterOptions();
            semesterSelect.disabled = false;
        } else {
            semesterSelect.disabled = true;
            subjectSelect.disabled = true;
        }
        
        updateResults();
    });
    
    // Semester change handler
    semesterSelect.addEventListener('change', function() {
        currentFilters.semester = this.value;
        resetDependentFilters(['subject']);
        
        if (this.value && currentFilters.branch && currentFilters.year) {
            populateSubjectOptions();
            subjectSelect.disabled = false;
        } else {
            subjectSelect.disabled = true;
        }
        
        updateResults();
    });
    
    // Subject change handler
    subjectSelect.addEventListener('change', function() {
        currentFilters.subject = this.value;
        updateResults();
    });
    
    // Clear filters button
    clearFiltersBtn.addEventListener('click', function() {
        clearAllFilters();
    });
    
    // Search button
    searchNotesBtn.addEventListener('click', function() {
        updateResults();
    });
}

function populateYearOptions() {
    if (!yearSelect || !currentFilters.branch) return;
    
    yearSelect.innerHTML = '<option value="">Select Year</option>';
    
    const branchData = notesData[currentFilters.branch];
    if (branchData) {
        Object.keys(branchData).forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year.replace('-', ' ');
            yearSelect.appendChild(option);
        });
    }
}

function populateSemesterOptions() {
    if (!semesterSelect || !currentFilters.branch || !currentFilters.year) return;
    
    semesterSelect.innerHTML = '<option value="">Select Semester</option>';
    
    const yearData = notesData[currentFilters.branch]?.[currentFilters.year];
    if (yearData) {
        Object.keys(yearData).forEach(semester => {
            const option = document.createElement('option');
            option.value = semester;
            option.textContent = semester.replace('-', ' ');
            semesterSelect.appendChild(option);
        });
    }
}

function populateSubjectOptions() {
    if (!subjectSelect || !currentFilters.branch || !currentFilters.year || !currentFilters.semester) return;
    
    subjectSelect.innerHTML = '<option value="">Select Subject</option>';
    
    const semesterData = notesData[currentFilters.branch]?.[currentFilters.year]?.[currentFilters.semester];
    if (semesterData) {
        Object.keys(semesterData).forEach(subject => {
            const option = document.createElement('option');
            option.value = subject;
            option.textContent = subject.replace(/-/g, ' ');
            subjectSelect.appendChild(option);
        });
    }
}

function resetDependentFilters(filters) {
    filters.forEach(filter => {
        currentFilters[filter] = '';
        const selectElement = document.getElementById(`${filter}-select`);
        if (selectElement) {
            selectElement.innerHTML = `<option value="">Select ${filter.charAt(0).toUpperCase() + filter.slice(1)}</option>`;
        }
    });
}

function clearAllFilters() {
    // Reset filter values
    currentFilters = {
        branch: '',
        year: '',
        semester: '',
        subject: ''
    };
    
    // Reset select elements
    branchSelect.value = '';
    yearSelect.value = '';
    semesterSelect.value = '';
    subjectSelect.value = '';
    
    // Disable dependent selects
    yearSelect.disabled = true;
    semesterSelect.disabled = true;
    subjectSelect.disabled = true;
    
    // Reset options
    yearSelect.innerHTML = '<option value="">Select Year</option>';
    semesterSelect.innerHTML = '<option value="">Select Semester</option>';
    subjectSelect.innerHTML = '<option value="">Select Subject</option>';
    
    // Show empty state
    showEmptyState();
    
    BTechNotesHub.showNotification('Filters cleared', 'info');
}

function updateResults() {
    const { branch, year, semester, subject } = currentFilters;
    
    // If no filters selected, show empty state
    if (!branch && !year && !semester && !subject) {
        showEmptyState();
        return;
    }
    
    // Get filtered notes
    const filteredNotes = getFilteredNotes();
    
    if (filteredNotes.length === 0) {
        showNoResults();
    } else {
        showResults(filteredNotes);
    }
    
    // Update results count
    updateResultsCount(filteredNotes.length);
}

function getFilteredNotes() {
    const notes = [];
    const { branch, year, semester, subject } = currentFilters;
    
    // If subject is selected, get notes for that specific subject
    if (branch && year && semester && subject) {
        const subjectNotes = notesData[branch]?.[year]?.[semester]?.[subject];
        if (subjectNotes) {
            subjectNotes.forEach(note => {
                notes.push({
                    ...note,
                    branch,
                    year,
                    semester,
                    subject
                });
            });
        }
    }
    // If semester is selected but not subject, get all notes for that semester
    else if (branch && year && semester) {
        const semesterData = notesData[branch]?.[year]?.[semester];
        if (semesterData) {
            Object.keys(semesterData).forEach(subjectKey => {
                semesterData[subjectKey].forEach(note => {
                    notes.push({
                        ...note,
                        branch,
                        year,
                        semester,
                        subject: subjectKey
                    });
                });
            });
        }
    }
    // If year is selected but not semester, get all notes for that year
    else if (branch && year) {
        const yearData = notesData[branch]?.[year];
        if (yearData) {
            Object.keys(yearData).forEach(semesterKey => {
                Object.keys(yearData[semesterKey]).forEach(subjectKey => {
                    yearData[semesterKey][subjectKey].forEach(note => {
                        notes.push({
                            ...note,
                            branch,
                            year,
                            semester: semesterKey,
                            subject: subjectKey
                        });
                    });
                });
            });
        }
    }
    // If only branch is selected, get all notes for that branch
    else if (branch) {
        const branchData = notesData[branch];
        if (branchData) {
            Object.keys(branchData).forEach(yearKey => {
                Object.keys(branchData[yearKey]).forEach(semesterKey => {
                    Object.keys(branchData[yearKey][semesterKey]).forEach(subjectKey => {
                        branchData[yearKey][semesterKey][subjectKey].forEach(note => {
                            notes.push({
                                ...note,
                                branch,
                                year: yearKey,
                                semester: semesterKey,
                                subject: subjectKey
                            });
                        });
                    });
                });
            });
        }
    }
    
    return notes;
}

function showLoadingState() {
    hideAllStates();
    if (loadingState) {
        loadingState.style.display = 'block';
    }
}

function hideLoadingState() {
    if (loadingState) {
        loadingState.style.display = 'none';
    }
}

function showEmptyState() {
    hideAllStates();
    if (emptyState) {
        emptyState.style.display = 'block';
    }
}

function showNoResults() {
    hideAllStates();
    if (noResults) {
        noResults.style.display = 'block';
    }
}

function showResults(notes) {
    hideAllStates();
    if (notesGrid) {
        notesGrid.style.display = 'grid';
        renderNotes(notes);
    }
}

function hideAllStates() {
    [loadingState, emptyState, noResults, notesGrid].forEach(element => {
        if (element) {
            element.style.display = 'none';
        }
    });
}

function renderNotes(notes) {
    if (!notesGrid) return;
    
    notesGrid.innerHTML = '';
    
    notes.forEach(note => {
        const noteCard = createNoteCard(note);
        notesGrid.appendChild(noteCard);
    });
}

function createNoteCard(note) {
    const card = document.createElement('div');
    card.className = 'note-card';
    card.innerHTML = `
        <div class="note-header">
            <h3 class="note-title">${note.title}</h3>
            <p class="note-subject">${note.subject.replace(/-/g, ' ')}</p>
        </div>
        <div class="note-meta">
            <div class="note-info">
                <span>
                    <i class="fas fa-weight"></i>
                    ${note.size}
                </span>
                <span>
                    <i class="fas fa-calendar"></i>
                    ${BTechNotesHub.formatDate(note.date)}
                </span>
            </div>
            <a href="#" class="note-download" data-note='${JSON.stringify(note)}'>
                <i class="fas fa-download"></i>
                Download
            </a>
        </div>
    `;
    
    // Add click handler for the download button
    const downloadBtn = card.querySelector('.note-download');
    downloadBtn.addEventListener('click', function(e) {
        e.preventDefault();
        const noteData = JSON.parse(this.getAttribute('data-note'));
        showNoteModal(noteData);
    });
    
    return card;
}

function updateResultsCount(count) {
    if (resultsCount) {
        if (count === 0) {
            resultsCount.textContent = 'No notes found';
        } else {
            resultsCount.textContent = `${count} note${count !== 1 ? 's' : ''} found`;
        }
    }
}

function initializeModal() {
    if (!noteModal) return;
    
    const modalClose = document.getElementById('modal-close');
    const modalCancel = document.getElementById('modal-cancel');
    
    // Close modal handlers
    [modalClose, modalCancel].forEach(btn => {
        if (btn) {
            btn.addEventListener('click', function() {
                hideNoteModal();
            });
        }
    });
    
    // Close modal when clicking outside
    noteModal.addEventListener('click', function(e) {
        if (e.target === noteModal) {
            hideNoteModal();
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && noteModal.classList.contains('active')) {
            hideNoteModal();
        }
    });
}

function showNoteModal(note) {
    if (!noteModal) return;
    
    // Update modal content
    const modalTitle = document.getElementById('modal-note-title');
    const modalSize = document.getElementById('modal-note-size');
    const modalDate = document.getElementById('modal-note-date');
    const modalDownload = document.getElementById('modal-download');
    
    if (modalTitle) modalTitle.textContent = note.title;
    if (modalSize) modalSize.textContent = note.size;
    if (modalDate) modalDate.textContent = BTechNotesHub.formatDate(note.date);
    if (modalDownload) {
        modalDownload.href = note.driveLink;
        modalDownload.addEventListener('click', function() {
            BTechNotesHub.showNotification('Opening download link...', 'info');
            hideNoteModal();
        });
    }
    
    // Show modal
    noteModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function hideNoteModal() {
    if (noteModal) {
        noteModal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function initializeSuggestions() {
    const suggestionTags = document.querySelectorAll('.suggestion-tag');
    
    suggestionTags.forEach(tag => {
        tag.addEventListener('click', function() {
            const branch = this.getAttribute('data-branch');
            const year = this.getAttribute('data-year');
            const semester = this.getAttribute('data-semester');
            
            // Set filters
            if (branch) {
                branchSelect.value = branch;
                currentFilters.branch = branch;
                populateYearOptions();
                yearSelect.disabled = false;
            }
            
            if (year) {
                yearSelect.value = year;
                currentFilters.year = year;
                populateSemesterOptions();
                semesterSelect.disabled = false;
            }
            
            if (semester) {
                semesterSelect.value = semester;
                currentFilters.semester = semester;
                populateSubjectOptions();
                subjectSelect.disabled = false;
            }
            
            // Update results
            updateResults();
            
            BTechNotesHub.showNotification('Filters applied from suggestion', 'success');
        });
    });
}

function checkURLParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const branch = urlParams.get('branch');
    
    if (branch && branchSelect) {
        // Wait for data to load
        const checkDataLoaded = setInterval(() => {
            if (Object.keys(notesData).length > 0) {
                clearInterval(checkDataLoaded);
                
                branchSelect.value = branch;
                currentFilters.branch = branch;
                populateYearOptions();
                yearSelect.disabled = false;
                updateResults();
                
                BTechNotesHub.showNotification(`Showing notes for ${getBranchFullName(branch)}`, 'info');
            }
        }, 100);
    }
}

// Handle suggest upload button
document.addEventListener('click', function(e) {
    if (e.target.id === 'suggest-upload' || e.target.closest('#suggest-upload')) {
        const subject = currentFilters.subject || 'the selected subject';
        const message = `Please consider uploading notes for ${subject}. Your contribution will help fellow students!`;
        BTechNotesHub.showNotification(message, 'info');
        
        // Redirect to upload guidelines
        setTimeout(() => {
            window.location.href = 'upload-guidelines.html';
        }, 2000);
    }
});

// Export functions for debugging
window.NotesPage = {
    notesData,
    currentFilters,
    getFilteredNotes,
    updateResults,
    clearAllFilters
};

