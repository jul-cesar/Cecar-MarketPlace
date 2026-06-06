
import { Route, Routes } from 'react-router'
import CreateListingPage from './pages/create-listing'
import ListingDetailPage from './pages/listing-detail'
import LoginPage from './pages/login'
import HomePage from './pages/home'

function App() {

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/publish" element={<CreateListingPage />} />
      <Route path="/listings/new" element={<CreateListingPage />} />
      <Route path="/listings/:id" element={<ListingDetailPage />} />
      <Route path="/login" element={<LoginPage />} />
    </Routes>
  )
}

export default App
