import json

# Function to parse the malformed YAML and convert to structured JSON
def convert_to_json(content):
    lines = content.split('\n')
    output = {}
    current_header = None
    current_cluster = None

    for line in lines:
        header_match = line.strip().startswith("Location:")
        ms_match = line.strip().startswith("MS")
        key_value_match = ":" in line and not header_match

        if header_match:
            # New header detected
            current_header = line.strip()
            output[current_header] = []
        elif ms_match and current_header:
            # New cluster under the current header
            if current_cluster:
                output[current_header].append(current_cluster)
            current_cluster = {"MS": line.strip()}
        elif key_value_match and current_cluster:
            # Add key-value pairs to the current cluster
            key, value = map(str.strip, line.split(":", 1))
            current_cluster[key] = value
        elif line.strip() == '' and current_cluster:
            # Save cluster on empty line
            output[current_header].append(current_cluster)
            current_cluster = None

    # Append the last cluster if not already added
    if current_cluster and current_header:
        output[current_header].append(current_cluster)

    return output


# Load and process the YAML content
structured_data = convert_to_json(yaml_content)

# Define output JSON file path
json_file_path = '/mnt/data/output.json'

# Save the structured JSON
with open(json_file_path, 'w') as json_file:
    json.dump(structured_data, json_file, indent=4)

json_file_path
