import { useState } from 'react';
import BackButton from '../components/backbutton';
import axios from 'axios';
import Spinner from '../components/spinner';
import { useParams, useNavigate } from 'react-router-dom';

const Deletebook = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  async function handleDeletebook() {
    try {
      await axios.delete(`http://localhost:5000/books/${id}`);
      navigate('/');
    } catch (error) {
      console.error('Error deleting book:', error);
    }
  }
  return (
    <div className="p-4">
      <BackButton to="/" />
      <h1 className="text-3xl font-bold mb-4">Delete</h1>
      {loading ? (
        <Spinner />
      ) : (
        <div> 
          <p className="text-xl">Are you sure you want to delete this book?</p>
          <button
            onClick={handleDeletebook}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
          >
            Delete Book
          </button>
        </div>
      )}
      
    </div>
  ) 
}
export default Deletebook