// Post types management
let postTypeCount = 0;

function addPostType(migrationType = 'postType', typeName = '', sourceUrl = '') {
    postTypeCount++;
    const container = document.getElementById('postTypesContainer');
    
    const entry = document.createElement('div');
    entry.className = 'post-type-entry';
    entry.id = `postType-${postTypeCount}`;
    
    entry.innerHTML = `
        <div class="form-group">
            <label for="migrationType-${postTypeCount}">Migration Source Type *</label>
            <select id="migrationType-${postTypeCount}" 
                    name="migrationType" 
                    onchange="toggleMigrationFields(${postTypeCount})"
                    required>
                <option value="postType" ${migrationType === 'postType' ? 'selected' : ''}>Post Type</option>
                <option value="pageTemplate" ${migrationType === 'pageTemplate' ? 'selected' : ''}>Page Template</option>
            </select>
        </div>
        <div class="form-group">
            <label for="postTypeName-${postTypeCount}">
                <span class="label-posttype-${postTypeCount}">Post Type Name *</span>
                <span class="label-template-${postTypeCount}" style="display: none;">Page Template Name *</span>
            </label>
            <input type="text" 
                   id="postTypeName-${postTypeCount}" 
                   name="postTypeName" 
                   value="${typeName}"
                   placeholder="e.g., posts, pages, custom-post-type OR Service Page template"
                   required>
        </div>
        <div class="form-group">
            <label for="postTypeUrl-${postTypeCount}">Source URL *</label>
            <input type="url" 
                   id="postTypeUrl-${postTypeCount}" 
                   name="postTypeUrl" 
                   value="${sourceUrl}"
                   placeholder="https://example.com/blog/"
                   required>
        </div>
        <button type="button" class="btn-remove" onclick="removePostType(${postTypeCount})">
            Remove
        </button>
    `;
    
    container.appendChild(entry);
    toggleMigrationFields(postTypeCount);
}

function toggleMigrationFields(id) {
    const selectElement = document.getElementById(`migrationType-${id}`);
    const postTypeLabel = document.querySelector(`.label-posttype-${id}`);
    const templateLabel = document.querySelector(`.label-template-${id}`);
    
    if (selectElement && postTypeLabel && templateLabel) {
        const selectedValue = selectElement.value;
        
        if (selectedValue === 'postType') {
            postTypeLabel.style.display = '';
            templateLabel.style.display = 'none';
        } else {
            postTypeLabel.style.display = 'none';
            templateLabel.style.display = '';
        }
    }
}

function removePostType(id) {
    const entry = document.getElementById(`postType-${id}`);
    if (entry) {
        entry.remove();
    }
}

function getPostTypes() {
    const entries = document.querySelectorAll('.post-type-entry');
    const postTypes = [];
    
    entries.forEach(entry => {
        const typeSelect = entry.querySelector('select[name="migrationType"]');
        const nameInput = entry.querySelector('input[name="postTypeName"]');
        const urlInput = entry.querySelector('input[name="postTypeUrl"]');
        
        if (typeSelect && nameInput && urlInput && nameInput.value && urlInput.value) {
            postTypes.push({
                migrationType: typeSelect.value,
                name: nameInput.value.trim(),
                sourceUrl: urlInput.value.trim()
            });
        }
    });
    
    return postTypes;
}

// Form submission
async function handleSubmit(event) {
    event.preventDefault();
    
    const submitBtn = document.getElementById('submitBtn');
    const form = document.getElementById('requestForm');
    
    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    submitBtn.classList.add('loading');
    
    try {
        const postTypes = getPostTypes();
        
        if (postTypes.length === 0) {
            throw new Error('Please add at least one migration source (post type or page template)');
        }
        
        const formData = {
            requesterName: document.getElementById('requesterName').value.trim(),
            requesterEmail: document.getElementById('requesterEmail').value.trim(),
            replitUrl: document.getElementById('replitUrl').value.trim(),
            postTypes: postTypes,
            projectName: document.getElementById('projectName').value.trim(),
            projectDescription: document.getElementById('projectDescription').value.trim()
        };
        
        const response = await fetch('/api/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Show success message
            document.getElementById('requestId').textContent = result.requestId;
            form.style.display = 'none';
            document.getElementById('successMessage').style.display = 'block';
        } else {
            throw new Error(result.error || 'Submission failed');
        }
        
    } catch (error) {
        console.error('Submission error:', error);
        showError(error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Request';
        submitBtn.classList.remove('loading');
    }
}

function showError(message) {
    document.getElementById('errorText').textContent = message;
    document.getElementById('errorMessage').style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function hideError() {
    document.getElementById('errorMessage').style.display = 'none';
}

function resetForm() {
    document.getElementById('requestForm').reset();
    document.getElementById('postTypesContainer').innerHTML = '';
    postTypeCount = 0;
    addPostType(); // Add one default entry
    document.getElementById('successMessage').style.display = 'none';
    document.getElementById('requestForm').style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Add initial post type entry
    addPostType();
    
    // Add post type button
    document.getElementById('addPostType').addEventListener('click', () => {
        addPostType();
    });
    
    // Form submission
    document.getElementById('requestForm').addEventListener('submit', handleSubmit);
});
