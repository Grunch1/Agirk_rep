
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>Tag & Reference Updater</title>
    <script>
      // Helper function to send a POST request to the PHP script.
      function updateTag(group, node) {
        fetch('update_tags.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ group, node })
        })
        .then(response => response.json())
        .then(data => {
          if (data.error) {
            console.error("Error:", data.error);
            alert("Error: " + data.error);
          } else {
            console.log("Update successful:", data);
          }
        })
        .catch(err => {
          console.error("Fetch error:", err);
        });
      }

      document.addEventListener("DOMContentLoaded", function () {
        const containers = document.querySelectorAll(".action-container");

        /* --- 1. Create a reference link --- */
        const createLinkContainer = containers[0];
        const createLinkInputs = createLinkContainer.querySelectorAll("input");
        const createLinkButton = createLinkContainer.querySelector("button");

        createLinkButton.addEventListener("click", function () {
          const text = createLinkInputs[0].value.trim();
          const refLink = createLinkInputs[1].value.trim();
          if (text && refLink) {
            updateTag("References", { text: text, value: refLink });
          } else {
            alert("Please fill out both fields for the reference link.");
          }
        });

        /* --- 2. Tag a text --- */
        const tagTextContainer = containers[1];
        const tagTextInput = tagTextContainer.querySelector("input[type='text']");
        const tagSelect = tagTextContainer.querySelector("select");
        const tagTextButton = tagTextContainer.querySelector("button");

        // Map option text to JSON keys.
        const tagMapping = {
          "Person": "Individuals",
          "Animal": "Animals",
          "Location": "Locations",
          "Date": "Dates"
        };

        tagTextButton.addEventListener("click", function () {
          const text = tagTextInput.value.trim();
          const selectedOptionText = tagSelect.options[tagSelect.selectedIndex].text;
          const group = tagMapping[selectedOptionText];
          if (text && group) {
            updateTag(group, { text: text });
          } else {
            alert("Please enter text and select a valid tag type.");
          }
        });

        /* --- 3. Add a description --- */
        const addDescContainer = containers[2];
        const addDescInput = addDescContainer.querySelector("input[type='text']");
        const descriptionTextarea = addDescContainer.querySelector("textarea");
        const addDescButton = addDescContainer.querySelector("button");

        addDescButton.addEventListener("click", function () {
          const text = addDescInput.value.trim();
          const description = descriptionTextarea.value.trim();
          if (text && description) {
            updateTag("Footnotes", { text: text, value: description });
          } else {
            alert("Please enter both text and description.");
          }
        });
      });
    </script>
  </head>
  <body>
    <div class="action-container">
      <h3>1. Create a reference link</h3>
      <input type="text" placeholder="Enter text">
      <input type="text" placeholder="Enter reference link">
      <button class="w3-button w3-light-grey w3-left-align">Create Link</button>
    </div>
    <div class="action-container">
      <h3>2. Tag a text</h3>
      <input type="text" placeholder="Enter text">
      <select>
        <option>Person</option>
        <option>Animal</option>
        <option>Location</option>
        <option>Date</option>
      </select>
      <button class="w3-button w3-light-grey w3-left-align">Tag Text</button>
    </div>
    <div class="action-container">
      <h3>3. Add a description</h3>
      <input type="text" placeholder="Enter text">
      <textarea placeholder="Enter description"></textarea>
      <button class="w3-button w3-light-grey w3-left-align">Add Description</button>
    </div>
  </body>
</html>
