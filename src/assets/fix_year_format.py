"""
Fix Year Format in CSV Files
Converts year values from float format (e.g., '2020.0') to 4-digit integers (e.g., '2020')
"""
import os
import csv
import shutil
from datetime import datetime


def convert_year_to_int(year_value):
    """Convert year value to 4-digit integer string."""
    if not year_value or year_value.strip() == '':
        return ''
    
    try:
        # Convert to float first (handles '2020.0'), then to int, then to string
        return str(int(float(year_value)))
    except (ValueError, TypeError):
        # If conversion fails, return original value
        return year_value


def fix_csv_years(csv_path, backup=True):
    """
    Fix year format in a CSV file.
    
    Args:
        csv_path: Path to the CSV file
        backup: Whether to create a backup before modifying
    """
    if not os.path.exists(csv_path):
        print(f"✗ File not found: {csv_path}")
        return False
    
    # Create backup
    if backup:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = f"{csv_path}.backup_{timestamp}"
        shutil.copy2(csv_path, backup_path)
        print(f"✓ Backup created: {backup_path}")
    
    # Read the CSV
    rows = []
    headers = []
    year_column_index = None
    
    print(f"\nProcessing: {csv_path}")
    
    with open(csv_path, 'r', encoding='utf-8') as file:
        csv_reader = csv.reader(file)
        headers = next(csv_reader)
        
        # Find YEAR column
        try:
            year_column_index = headers.index('YEAR')
        except ValueError:
            print(f"⚠️  No YEAR column found in {csv_path}")
            return False
        
        # Process rows
        changed_count = 0
        for row in csv_reader:
            if year_column_index < len(row):
                original_year = row[year_column_index]
                converted_year = convert_year_to_int(original_year)
                
                if original_year != converted_year:
                    changed_count += 1
                
                row[year_column_index] = converted_year
            
            rows.append(row)
    
    # Write back to file
    with open(csv_path, 'w', encoding='utf-8', newline='') as file:
        csv_writer = csv.writer(file)
        csv_writer.writerow(headers)
        csv_writer.writerows(rows)
    
    print(f"✓ Converted {changed_count} year values")
    print(f"✓ File updated: {csv_path}")
    return True


def main():
    """Main function to fix year format in CSV files."""
    # Get script directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    print("=" * 60)
    print("CSV Year Format Converter")
    print("Converts: '2020.0' → '2020'")
    print("=" * 60)
    
    # List of CSV files to process
    csv_files = [
        os.path.join(script_dir, 'songs.csv'),
        os.path.join(script_dir, 'kpop.csv'),
        # Add more CSV files here if needed
    ]
    
    success_count = 0
    for csv_file in csv_files:
        if os.path.exists(csv_file):
            if fix_csv_years(csv_file, backup=True):
                success_count += 1
            print()
        else:
            print(f"⚠️  Skipping (not found): {csv_file}\n")
    
    print("=" * 60)
    print(f"✓ Successfully processed {success_count}/{len(csv_files)} files")
    print("=" * 60)


if __name__ == "__main__":
    main()
