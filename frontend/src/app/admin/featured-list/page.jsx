"use client";

import React, { useEffect, useState } from "react";
import axios from "../../../utils/axios";
import Spinner from "../../../components/spinner";

export default function FeaturedList() {
  const [featuredBooks, setFeaturedBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removing, setRemoving] = useState("");

  useEffect(() => {
    fetchFeaturedBooks();
  }, []);

  const fetchFeaturedBooks = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get("/books/featured/list");
      setFeaturedBooks(response.data.books || []);
    } catch (err) {
      setError("Failed to fetch featured books.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFeatured = async (bookId) => {
    if (!window.confirm("Remove this book from featured list?")) return;
    setRemoving(bookId);
    try {
      await axios.post(`/books/${bookId}/unfeature`);
      setFeaturedBooks((prev) => prev.filter((b) => b._id !== bookId));
    } catch (err) {
      alert("Failed to remove featured book.");
    } finally {
      setRemoving("");
    }
  };

  return (
    <div className="min-h-screen p-8">
      <h2 className="text-2xl font-bold mb-6">Featured Books (Max 11)</h2>
      {loading ? (
        <Spinner />
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {featuredBooks.map((book) => (
            <div key={book._id} className="border rounded-xl p-4 bg-white/70 flex flex-col">
              <img src={book.coverImage || book.image} alt={book.title} className="h-40 object-cover rounded mb-3" />
              <div className="font-semibold mb-1">{book.title}</div>
              <div className="text-sm text-gray-600 mb-2">{book.author}</div>
              <button
                onClick={() => handleRemoveFeatured(book._id)}
                disabled={removing === book._id}
                className="mt-auto bg-red-500 hover:bg-red-600 text-white rounded px-4 py-2 text-sm disabled:opacity-60"
              >
                {removing === book._id ? "Removing..." : "Remove from Featured"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
