## Features
- This extension provides a tool to generate types code from the selected component name or selected props.
- The extension can detect the type of your prop in case of strings, boolean, number, arrays when the default value is given. It can also generate additional interfaces in case there are any user defined objects.
- In case the type cannot be determined, the interface will not be providing the type. That needs to be done automatically.

## Usage
This extension can be used in three ways:

    1. Selecting your component's name
        - Using this way, you can generate the prop type interface code for your function component.
![Image Description](https://github.com/kunjalsoni-simformsolutions/typesgenerator/blob/main/images/image1.png?raw=true)

![Image Description](https://github.com/kunjalsoni-simformsolutions/typesgenerator/blob/main/images/Video1.gif?raw=true)

![Image Description](https://github.com/kunjalsoni-simformsolutions/typesgenerator/blob/main/images/Video2.gif?raw=true)

        - After selecting the name and pressing shortcut key "command + T", you can generate the interface code for the selected component and it will be added right above your selected component.
        
        - If you want other options such as you want to copy the interface code to your clipboard, or you want to add the interface code in your types file, use the shortcut "command + shift + T". 
        
        This will prompt you to select between 3 options:
            - "Copy to clipboard"
            - "Add above"
            - "Create new file"

        If you already have a types file created, the interface code will be appended in your existing file.

    2. Selecting your component's all props
        - By selecting the props of your component or function.
![Image Description](https://github.com/kunjalsoni-simformsolutions/typesgenerator/blob/main/images/image2.png?raw=true)

![Image Description](https://github.com/kunjalsoni-simformsolutions/typesgenerator/blob/main/images/Video3.gif?raw=true)

        - Just like the first approach, you may use shortcut keys "command + T" or "command + shift + T" to generate the interface code.

    3. Selecting only required props
        - By selecting only required props. This approach is mostly used when you already have your interface created but you have added additional props in your component.
        
![Image Description](https://github.com/kunjalsoni-simformsolutions/typesgenerator/blob/main/images/image3.png?raw=true)

![Image Description](https://github.com/kunjalsoni-simformsolutions/typesgenerator/blob/main/images/Video4.gif?raw=true)

        - After selecting your props, the props can be copied to clipboard using the shortcut keys "shift + T". This will copy the selected prop types and copy to clipboard. Now you may paste it inside your already created interface code.


