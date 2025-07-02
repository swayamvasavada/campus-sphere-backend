const router = require('express').Router();
const libraryController = require('../controllers/library.controller');

// To get list of all books in library
router.get('/', libraryController.fetchBooks);

router.get('/summary', libraryController.fetchSummary)

// To get details of issued books.
router.get('/issued-books', libraryController.fetchIssuedBook);

// TO send auto remainder
router.get('/auto-remainder', libraryController.sendAutoRemainder);

// To get details of specific book. Only Librarian can access.
router.get('/:bookId', libraryController.findBook)

// To add books in library. It can only be accessed by Librarian
router.post('/add-book', libraryController.addBook);

// To delete books from library book list. It can only be accessed by Librarian
router.post('/delete-book/:bookId', libraryController.deleteBook);

// To update book record in library book list. It can only be accessed by librarian
router.post('/update-book/:bookId', libraryController.updateBook);

// To issue new book.
router.post('/issue-book/:bookId', libraryController.issueBook);

// To get issuer Detail
router.get('/issuer-detail/:issuerId', libraryController.issuerDetail);

// To return the issued book.
router.post('/return-book/:issuerId', libraryController.returnBook);

// To send remainder about issued book
router.post('/reminder/:issueId', libraryController.manualRemainder);

// To view issued book details.
router.get('/my-issues', libraryController.userIssues);

module.exports = router;