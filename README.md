# Project Title

Otter Pill Server  :otter: :pill: 💻

## Overview

Otter Pill is a responsive web application designed to simplify medication management and improve adherence to prescribed treatments. It empowers individuals to confidently track their medications through a user-friendly interface accessible on tablets, desktops, and mobile devices.
Follow this link to see the front-end project for Otter Pill and more details about the overall project.
[https://github.com/AanelyaA/capstone-medication](url)

### Installation

1.  git clone this repository and open in VScode or 

```
git clone https://github.com/AanelyaA/medication-server
cd medication-server
```

2.  Once the repository is cloned, you can open it in Visual Studio Code by navigating to the directory and typing
```
code .
````
in the terminal. This command opens the current directory in Visual Studio Code (if you have set this as an option).


3. Install dependencies:
```
npm i
```

4. Create an environment file (`.env`) based on the provided `env.sample` file.

    ```
    PORT=8080
    DB_HOST=localhost
    DB_USER=yourusername
    DB_PASSWORD=yourpassword
    DB_NAME=nameofschema
    ```
    - make sure to change localhost ip address, and change DB_USER, DB_PASSWORD, DB_NAME accordingly

  
5. In MySQL Workbench, create a new schema by running the following command:

    ```
    CREATE SCHEMA nameofschema;
    ```
    - make sure you are using the same name of database as the one in env file


6. After setting up the environment, proceed with database migration and seeding:

```
npm run migrate
npm run seed
```

7. Start the application using:
```
npm start
```

8. Navigate to the frontend to ensure everything is running smoothly.


### Dependencies:

- axios
- cors
- dotenv
- knex
- mysql2
- node-cron
- nodemon


### Features

- node-cron: Enables scheduling medications to be set to "TO TAKE" at midnight.
- NFC functionality
 NFC Functionality Instructions:
   To utilize the NFC functionality:
    - Ensure you have an NFC application capable of reading and writing NFC tags (e.g., "NFC Tools").
    - Read the NFC tag to verify it is clear.
    - Write the following URL to the NFC tag:
      ```
      http://yourIPAddress:8080/medications/nfc?id=IDMED&time=MEDTIME&taken=true
    - Replace yourIPAddress with the IP address of your server and IDMED with the medication ID obtained from the medication detail page by pressing the otter image. MEDTIME should be the time you wish to set for the medication (e.g., 14:30).
    - Once configured, tap the phone on the NFC tag and press the link when prompted.
    - The medication status should update to "TAKEN" accordingly.
      

### Next Steps and Lessons Learned

- Recognized the importance of thorough planning and design in creating efficient MySQL tables.
- Next steps are to dive deeper and implement user authentication and authorization to ensure secure access to the application.
- Enhance the user interface with additional features and functionalities based on user feedback.
- Explore integrating additional APIs or services to enhance the application's capabilities.


