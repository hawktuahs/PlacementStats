import pandas as pd
import json
import os
import math

def clean_value(val):
    if isinstance(val, float) and math.isnan(val):
        return None
    return val

def process_stats_sheet(df, company_col):
    # Set the headers from row 1 (0-indexed is 1)
    df.columns = df.iloc[1]
    # Drop rows 0, 1, 2 (Row 0 is categories, Row 1 is header, Row 2 is totals)
    df = df.iloc[3:].reset_index(drop=True)
    
    # Filter valid companies
    records = []
    for _, row in df.iterrows():
        comp = row.get(company_col)
        if pd.isna(comp):
            continue
            
        record = {}
        for col in df.columns:
            if pd.isna(col): continue
            col_str = str(col).strip()
            val = row[col]
            record[col_str] = clean_value(val)
        records.append(record)
    return records

def process_students(df):
    records = []
    for _, row in df.iterrows():
        name = row.get('Name')
        if pd.isna(name):
            continue
        record = {}
        for col in df.columns:
            col_str = str(col).strip()
            val = row[col]
            record[col_str] = clean_value(val)
        records.append(record)
    return records

def main():
    base_dir = r"c:\Users\regre\Downloads\placement data"
    excel_path = os.path.join(base_dir, "Placement & Internship Stats_2026 (1).xlsx")
    dash_dir = os.path.join(base_dir, "dashboard")
    os.makedirs(dash_dir, exist_ok=True)
    
    xls = pd.ExcelFile(excel_path)
    
    data = {}
    
    # Parse Full Stats
    df_full = pd.read_excel(xls, sheet_name='Full Stats')
    data['full_stats'] = process_stats_sheet(df_full, 'Recruitment Team Visited')
    
    # Parse Internship
    df_intern = pd.read_excel(xls, sheet_name='Internship')
    data['internship'] = process_stats_sheet(df_intern, 'Company Name')
    
    # Parse Students
    df_students = pd.read_excel(xls, sheet_name='Students List')
    data['students'] = process_students(df_students)
    
    # Convert to JS file
    js_content = "const placementData = " + json.dumps(data, indent=2, default=str) + ";"
    with open(os.path.join(dash_dir, 'data.js'), 'w', encoding='utf-8') as f:
        f.write(js_content)
        
    print("Data successfully converted and saved to dashboard/data.js")

if __name__ == "__main__":
    main()
