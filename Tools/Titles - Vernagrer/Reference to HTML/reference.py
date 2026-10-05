import os

def reformat_references(input_file, output_file):
    # Template for the HTML structure
    template = """
<div class="Reference_of_Araks">
    <h3> Name: {name}</h3>
    <h4>
        - - - - - - - - - - - - - - - - - - - - - - <a href="{link}"> Story origin link</a>
    </h4>
    <a href="{link}">
        <button type="Manuscript_Download">learn more</button> 
    </a>
</div>
    """

    try:
        print(f"Trying to open the file: {input_file}")
        with open(input_file, 'r', encoding='utf-8') as file:
            lines = file.readlines()
        print("File opened and read successfully.")
        
        formatted_entries = []

        for line in lines:
            if ' - ' in line:
                try:
                    name, link = line.split(' - ', 1)
                    name = name.strip()
                    link = link.strip()
                    formatted_entry = template.format(name=name, link=link)
                    formatted_entries.append(formatted_entry)
                except ValueError as e:
                    print(f"Skipping line due to splitting error: {line.strip()} - Error: {e}")
            else:
                print(f"Skipping line without delimiter: {line.strip()}")
        
        print(f"Writing to output file: {output_file}")
        with open(output_file, 'w', encoding='utf-8') as output:
            output.write('\n'.join(formatted_entries))
        
        print(f"Output written to: {output_file}")

    except FileNotFoundError:
        print(f"Error: The file {input_file} does not exist. Please check the path.")
    except Exception as e:
        raise Exception(f"An error occurred: {e}")

# Example usage
input_file = 'reference.txt'  # Ensure this is the correct path to your input file
output_file = 'references.html'  # Replace with desired output file name

reformat_references(input_file, output_file)
