const API_URL = "/books";

const form = document.getElementById("bookForm");
const idInput = document.getElementById("bookId");
const titleInput = document.getElementById("title");
const authorInput = document.getElementById("author");
const yearInput = document.getElementById("year");
const coverInput = document.getElementById("cover");

const formTitle = document.getElementById("formTitle");
const submitBtn = document.getElementById("submitBtn");
const cancelBtn = document.getElementById("cancelBtn");
const refreshBtn = document.getElementById("refreshBtn");
const searchInput = document.getElementById("search");
const booksList = document.getElementById("booksList");
const statusText = document.getElementById("status");

let books = [];

// Отображение сообщений
function showStatus(message, isError = false) {
    statusText.textContent = message;
    statusText.style.color = isError ? "#ff8797" : "";
}

// Универсальный запрос к серверу
async function request(url, options = {}) {
    const headers = { ...(options.headers || {}) };

    // Для FormData браузер сам установит Content-Type
    if (!(options.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
    }

    const response = await fetch(url, {
        ...options,
        headers
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(
            data?.message || data?.error || `Ошибка: ${response.status}`
        );
    }

    return data;
}

// Загрузка обложки книги
async function uploadCover(bookId, file) {
    const formData = new FormData();

    // Название поля должно совпадать с upload.single('cover')
    formData.append("cover", file);

    return await request(
        `${API_URL}/${encodeURIComponent(bookId)}/cover`,
        {
            method: "POST",
            body: formData
        }
    );
}

// Получение книг с сервера
async function loadBooks() {
    showStatus("Загружаем книги...");

    try {
        const data = await request(API_URL);

        books = Array.isArray(data) ? data : (data.books || []);
        renderBooks();
    } catch (error) {
        booksList.innerHTML = "";

        showStatus(
            `Не удалось загрузить книги: ${error.message}. Проверьте сервер.`,
            true
        );
    }
}

// Отображение каталога и поиск
function renderBooks() {
    const query = searchInput.value.trim().toLowerCase();

    const filtered = books.filter(book =>
        String(book.title || "").toLowerCase().includes(query) ||
        String(book.author || "").toLowerCase().includes(query)
    );

    booksList.innerHTML = "";
    showStatus(`Книг в каталоге: ${filtered.length}`);

    if (filtered.length === 0) {
        const empty = document.createElement("div");

        empty.className = "empty";
        empty.textContent = query
            ? "По вашему запросу ничего не найдено."
            : "Книг пока нет. Добавьте первую книгу выше.";

        booksList.append(empty);
        return;
    }

    filtered.forEach(book => {
        const card = document.createElement("article");
        card.className = "book";

        // Обложка книги
        if (book.coverUrl) {
            const cover = document.createElement("img");

            cover.src = book.coverUrl;
            cover.alt = `Обложка книги ${book.title}`;
            cover.className = "book-cover";

            // Размеры изображения
            cover.style.width = "140px";
            cover.style.height = "200px";
            cover.style.objectFit = "cover";
            cover.style.borderRadius = "8px";
            cover.style.marginBottom = "12px";

            card.append(cover);
        }

        const title = document.createElement("h3");
        title.textContent = book.title || "Без названия";

        const author = document.createElement("p");
        author.className = "author";
        author.textContent = book.author || "Автор не указан";

        const year = document.createElement("p");
        year.className = "year";
        year.textContent = book.year
            ? `Год издания: ${book.year}`
            : "Год издания не указан";

        const actions = document.createElement("div");
        actions.className = "book-actions";

        const editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.className = "button secondary";
        editBtn.textContent = "Изменить";

        editBtn.addEventListener("click", () => startEditing(book));

        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "button danger";
        deleteBtn.textContent = "Удалить";

        deleteBtn.addEventListener("click", () => deleteBook(book));

        // Кнопка удаления обложки
if (book.coverUrl) {
    const deleteCoverBtn = document.createElement("button");

    deleteCoverBtn.type = "button";
    deleteCoverBtn.className = "button danger";
    deleteCoverBtn.textContent = "Удалить обложку";

    deleteCoverBtn.addEventListener("click", () => {
        deleteCover(book);
    });

    actions.append(deleteCoverBtn);
}

actions.append(editBtn, deleteBtn);
card.append(title, author, year, actions);

        booksList.append(card);
    });
}

// Подготовка формы к редактированию
function startEditing(book) {
    idInput.value = book.id;
    titleInput.value = book.title || "";
    authorInput.value = book.author || "";
    yearInput.value = book.year ?? "";

    // При редактировании можно выбрать новую обложку
    coverInput.value = "";

    formTitle.textContent = "Редактировать книгу";
    submitBtn.textContent = "Сохранить изменения";
    cancelBtn.classList.remove("hidden");

    titleInput.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
}

// Очистка формы
function resetForm() {
    form.reset();
    idInput.value = "";

    formTitle.textContent = "Добавить книгу";
    submitBtn.textContent = "Добавить книгу";
    cancelBtn.classList.add("hidden");
}

// Добавление и изменение книги
form.addEventListener("submit", async event => {
    event.preventDefault();

    const id = idInput.value;
    const rawYear = yearInput.value.trim();
    const coverFile = coverInput.files[0];

    const payload = {
        title: titleInput.value.trim(),
        author: authorInput.value.trim(),
        year: rawYear === "" ? null : Number(rawYear)
    };

    if (!payload.title || !payload.author) {
        showStatus("Заполните название книги и автора.", true);
        return;
    }

    if (
        coverFile &&
        !["image/jpeg", "image/png", "image/webp"].includes(coverFile.type)
    ) {
        showStatus("Выберите изображение JPEG, PNG или WebP.", true);
        return;
    }

    if (coverFile && coverFile.size > 2 * 1024 * 1024) {
        showStatus("Размер обложки не должен превышать 2 МБ.", true);
        return;
    }

    submitBtn.disabled = true;

    try {
        let savedBook;

        if (id) {
            // Обновление существующей книги
            savedBook = await request(
                `${API_URL}/${encodeURIComponent(id)}`,
                {
                    method: "PUT",
                    body: JSON.stringify(payload)
                }
            );
        } else {
            // Создание новой книги
            savedBook = await request(API_URL, {
                method: "POST",
                body: JSON.stringify(payload)
            });
        }

        // Если выбрано изображение, загружаем его
        if (coverFile) {
            await uploadCover(savedBook.id, coverFile);
        }

        resetForm();
        await loadBooks();

        showStatus(
            id
                ? "Книга успешно обновлена."
                : "Книга успешно добавлена."
        );

    } catch (error) {
        // Книга могла сохраниться, даже если загрузка обложки не удалась
        await loadBooks();

        showStatus(
            `Ошибка сохранения или загрузки обложки: ${error.message}`,
            true
        );
    } finally {
        submitBtn.disabled = false;
    }
});

// Удаление книги

// Удаление обложки книги
async function deleteCover(book) {
    const confirmed = window.confirm(
        `Удалить обложку книги «${book.title}»?`
    );

    if (!confirmed) return;

    try {
        await request(
            `${API_URL}/${encodeURIComponent(book.id)}/cover`,
            {
                method: "DELETE"
            }
        );

        await loadBooks();

        showStatus("Обложка успешно удалена.");

    } catch (error) {
        showStatus(
            `Не удалось удалить обложку: ${error.message}`,
            true
        );
    }
}
async function deleteBook(book) {
    const confirmed = window.confirm(
        `Удалить книгу «${book.title}»?`
    );

    if (!confirmed) return;

    try {
        await request(`${API_URL}/${encodeURIComponent(book.id)}`, {
            method: "DELETE"
        });

        if (String(idInput.value) === String(book.id)) {
            resetForm();
        }

        await loadBooks();
        showStatus("Книга удалена.");

    } catch (error) {
        showStatus(
            `Не удалось удалить книгу: ${error.message}`,
            true
        );
    }
}

// Кнопки и поиск
cancelBtn.addEventListener("click", resetForm);
refreshBtn.addEventListener("click", loadBooks);
searchInput.addEventListener("input", renderBooks);

// Загрузить каталог при открытии страницы
loadBooks();