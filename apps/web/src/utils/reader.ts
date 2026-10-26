type SelectFileOptions = {
    accept?: string;
    multiple?: boolean;
    handleFile: (file: File) => void;
};

export const selectFile = async ({ accept, multiple = false, handleFile }: SelectFileOptions) => {
    const id = "rss-file-input";
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.id = id;
    if (accept) {
        fileInput.accept = accept;
    }
    fileInput.multiple = multiple;
    fileInput.style.display = "none";

    fileInput.addEventListener(
        "change",
        () => {
            const file = fileInput.files?.[0];
            fileInput.remove();
            if (file) {
                handleFile(file);
            }
        },
        { once: true }
    );
    fileInput.addEventListener("cancel", () => fileInput.remove(), { once: true });
    document.body.appendChild(fileInput);
    fileInput.click();
};

export const parseXml = async (file: File) => {
    const text = await file.text();
    const parser = new DOMParser();
    return parser.parseFromString(text, "text/xml");
};
