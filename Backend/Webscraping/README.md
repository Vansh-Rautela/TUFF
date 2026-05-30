# Trend-Setters Fashion Scraper

This is a multi-site web scraping application built with Python and Streamlit. It allows you to search for fashion products across various e-commerce websites and compares the results.

## How to Run Locally

1.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

2.  **Run the Streamlit app:**
    ```bash
    streamlit run app.py
    ```

## How to Deploy to Streamlit Community Cloud (Free!)

Deploying a Streamlit app that uses Selenium requires one extra step to ensure Chrome can run in the cloud environment. Here’s the complete guide:

### Step 1: Add a `packages.txt` File

Streamlit's cloud environment doesn't include all the system packages needed to run Chrome by default. To fix this, you need to add a `packages.txt` file to your project with the following content:

```text
chromium
chromium-driver
```

I have already created this file for you. This tells Streamlit to install the necessary dependencies before running your app.

### Step 2: Push Your Code to a Public GitHub Repository

### Step 1: Push Your Code to a Public GitHub Repository

If you haven't already, create a new public repository on [GitHub](https://github.com/new) and push your project code to it.

If you're new to Git, you can follow these commands in your project directory:

```bash
# Initialize a new Git repository
git init

# Add all your files to the repository
git add .

# Commit your files
git commit -m "Initial commit"

# Add your GitHub repository URL (replace with your actual URL)
git remote add origin https://github.com/your-username/your-repo-name.git

# Push your code to GitHub
git push -u origin master
```

### Step 2: Sign Up for Streamlit Community Cloud

1.  Go to the [Streamlit Community Cloud](https://streamlit.io/cloud) website.
2.  Click on "Sign up" and choose the option to sign up with your GitHub account. It's free!

### Step 3: Deploy Your App

1.  Once you're logged in, click the **"New app"** button from your Streamlit dashboard.
2.  Select the GitHub repository you just created.
3.  Make sure the **main file path** is set to `app.py`.
4.  Click the **"Deploy!"** button.

That's it! Streamlit will handle the rest. Your app will be live in a few minutes, and you'll have a public URL to share with anyone.

Let me know if you have any questions about this process!
