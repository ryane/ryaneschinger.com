Markdown Resume
===================

Credit: https://github.com/mszep/pandoc_resume

## Instructions:

1. Install ConTeXt: http://wiki.contextgarden.net/Mac_Installation#Single_user_installation

    On Ubuntu:

    ```shell
    apt install context
    ```

1. Make sure it is in the path (it should be in /usr/bin on Ubuntu):

    ```bash
    export PATH=$PATH:/Users/ryan/Projects/ConTeXt/tex/texmf-osx-64/bin
    ```

1. Install pandoc

    OSX:

    ```shell
    brew install pandoc
    ```

    Ubuntu:

    ```shell
    apt install pandoc
    ```

1. Edit resume.md

1. Generate

    ```shell
    make
    ```
