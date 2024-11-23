'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, ChevronLeft, ChevronRight, X, Trash2, Edit } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'; // Added import for QRCodeSVG
const SERVER_URL = "https://localhost:5000"

export default function App() {
  const [products, setProducts] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [showItemsPopup, setShowItemsPopup] = useState(null)
  const [showDeletePopup, setShowDeletePopup] = useState(null)
  const [showEditPopup, setShowEditPopup] = useState(null)
  const [newTitle, setNewTitle] = useState('')
  const [newItems, setNewItems] = useState([''])
  const [newPassword, setNewPassword] = useState('')
  const [deletePassword, setDeletePassword] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [editError, setEditError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const productsPerPage = 9
  const formRef = useRef(null)
  const [soldItems, setSoldItems] = useState({})
  const [showSoldPopup, setShowSoldPopup] = useState(null)
  const [showQR, setShowQR] = useState(false); // Added state for QR code visibility

  useEffect(() => {
    fetchProducts()
    fetchSoldStatus()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch(SERVER_URL+'/api/products')
      const data = await response.json()
      setProducts(data)
    } catch (error) {
      console.error('Failed to fetch products:', error)
    }
  }

  const fetchSoldStatus = async () => {
    try {
      const response = await fetch(`${SERVER_URL}/api/products/sold-status`)
      const data = await response.json()
      setSoldItems(data)
    } catch (error) {
      console.error('Failed to fetch sold status:', error)
    }
  }

  const handleAddProduct = async (e) => {
    e.preventDefault()
    if (newTitle.trim() && newItems[0].trim() && newPassword.trim()) {
      try {
        const response = await fetch(SERVER_URL+'/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: newTitle,
            items: newItems.filter(item => item.trim() !== '').join('\n'),
            password: newPassword
          })
        })
        const data = await response.json()
        setProducts([...products, data])
        setNewTitle('')
        setNewItems([''])
        setNewPassword('')
        setShowForm(false)
        setCurrentPage(Math.ceil((products.length + 1) / productsPerPage))
      } catch (error) {
        console.error('Failed to add product:', error)
      }
    }
  }

  const handleAddItem = () => {
    setNewItems([...newItems, ''])
    setTimeout(() => {
      if (formRef.current) {
        const inputs = formRef.current.querySelectorAll('input[type="text"]')
        const lastInput = inputs[inputs.length - 1]
        lastInput.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 0)
  }

  const handleRemoveItem = (index) => {
    if (index === 0) return
    setNewItems(newItems.filter((_, i) => i !== index))
  }

  const handleDeleteAttempt = (id) => {
    setShowDeletePopup(id);
    setDeletePassword('');
    setDeleteError('')
  }

  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch(`${SERVER_URL}/api/products/${showDeletePopup}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword })
      })
      if (response.ok) {
        setProducts(products.filter(p => p.id !== showDeletePopup))
        setShowDeletePopup(null)
      } else {
        const data = await response.json()
        setDeleteError(data.error)
      }
    } catch (error) {
      console.error('Failed to delete product:', error)
      setDeleteError('삭제 중 오류가 발생했습니다.')
    }
    setDeletePassword('');
  }

  const handleSoldStatusChange = async (productId, itemIndex) => {
    try {
      const response = await fetch(`${SERVER_URL}/api/products/${productId}/sold`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword, itemIndex })
      })
      if (response.ok) {
        setSoldItems(prev => ({
          ...prev,
          [productId]: {
            ...(prev[productId] || {}),
            [itemIndex]: !(prev[productId] && prev[productId][itemIndex])
          }
        }))
        setShowSoldPopup(null)
      } else {
        const data = await response.json()
        setDeleteError(data.error || '본인의 상품만 수정하실 수 있습니다.')
      }
    } catch (error) {
      console.error('Failed to update sold status:', error)
      setDeleteError('상태 변경 중 오류가 발생했습니다.')
    }
    setDeletePassword('');
  }

  const handleEditAttempt = (product) => {
    setShowEditPopup(product);
    setNewTitle(product.title);
    setNewItems(product.items.split('\n'));
    setEditPassword('');
    setEditError('');
  }

  const handleEditConfirm = async () => {
    try {
      const response = await fetch(`${SERVER_URL}/api/products/${showEditPopup.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          items: newItems.filter(item => item.trim() !== '').join('\n'),
          password: editPassword
        })
      })
      if (response.ok) {
        const updatedProducts = products.map(p => 
          p.id === showEditPopup.id ? { ...p, title: newTitle, items: newItems.join('\n') } : p
        )
        setProducts(updatedProducts)
        setShowEditPopup(null)
      } else {
        const data = await response.json()
        setEditError(data.error)
      }
    } catch (error) {
      console.error('Failed to edit product:', error)
      setEditError('수정 중 오류가 발생했습니다.')
    }
    setEditPassword('');
  }

  const indexOfLastProduct = currentPage * productsPerPage
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage
  const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct)
  const totalPages = Math.ceil(products.length / productsPerPage)
  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  return (
    <div className="min-h-screen bg-orange-400 p-4 md:p-8">
      <div 
        className="fixed top-4 right-4 z-50"
        onMouseEnter={() => setShowQR(true)}
        onMouseLeave={() => setShowQR(false)}
      >
        <button
          className="bg-blue-500 text-white p-2 rounded-full shadow-lg hover:bg-blue-600 transition-colors"
          aria-label="피드백 QR 코드"
        >
          의견을 주세요!
        </button>
        {showQR && (
          <div className="absolute top-full right-0 mt-2 bg-white p-4 rounded-lg shadow-xl">
            <QRCodeSVG 
              value="https://forms.gle/4RzdK5St7VBWDzmh8" 
              size={128}
            />
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {currentProducts.map(product => (
          <div key={product.id} className="bg-white rounded-lg shadow-lg p-4 relative">
            <h2 className="text-xl font-bold mb-2">{product.title}</h2>
            <ul className="mb-4 space-y-1">
              {product.items.split('\n').slice(0, 3).map((item, index) => (
                <li key={index} className={`text-gray-600 ${soldItems[product.id]?.[index] ? 'line-through' : ''}`}>
                  {item}
                </li>
              ))}
              {product.items.split('\n').length > 3 && (
                <li className="text-gray-500">...그 외 {product.items.split('\n').length - 3}개</li>
              )}
            </ul>
            <div className="flex justify-between gap-2">
              <button 
                onClick={() => setShowItemsPopup(product.id)}
                className="flex-1 bg-gray-800 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
              >
                확인
              </button>
              <button 
                onClick={() => handleEditAttempt(product)}
                className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 transition-colors"
                aria-label="수정"
              >
                <Edit className="h-5 w-5" />
              </button>
              <button 
                onClick={() => handleDeleteAttempt(product.id)}
                className="bg-red-500 text-white p-2 rounded-md hover:bg-red-600 transition-colors"
                aria-label="삭제"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">새 상품 추가</h2>
            <form onSubmit={handleAddProduct} className="space-y-4" ref={formRef}>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="닉네임 (필수)"
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <div className="max-h-60 overflow-y-auto pr-2">
                {newItems.map((item, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const updatedItems = [...newItems]
                        updatedItems[index] = e.target.value
                        setNewItems(updatedItems)
                      }}
                      placeholder={index === 0 ? "오픈카톡 링크를 넣어주세요" : "추가 상품 정보"}
                      className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required={index === 0}
                    />
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="bg-red-500 text-white p-2 rounded-md hover:bg-red-600 transition-colors"
                        aria-label={`항목 ${index + 1} 삭제`}
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition-colors"
              >
                항목 추가
              </button>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="비밀번호 (필수)"
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  추가
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showItemsPopup !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {products.find(p => p.id === showItemsPopup)?.title} 상세 정보
            </h2>
            <ul className="space-y-2 mb-4">
              {products.find(p => p.id === showItemsPopup)?.items.split('\n').map((item, index) => (
                <li key={index} className="p-2 bg-gray-100 rounded-md flex justify-between items-center">
                  <span className={soldItems[showItemsPopup]?.[index] ? 'line-through' : ''}>
                    {item}
                  </span>
                  <button
                    onClick={() => {setShowSoldPopup({ productId: showItemsPopup, itemIndex: index }); setDeletePassword('');}}
                    className="ml-2 px-2 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors"
                  >
                    {soldItems[showItemsPopup]?.[index] ? '판매 취소' : '판매 완료'}
                  </button>
                </li>
              ))}
            </ul>
            <button
              onClick={() => setShowItemsPopup(null)}
              className="w-full bg-gray-800 text-white py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {showDeletePopup !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">상품 삭제</h2>
            <p className="mb-4">이 상품을 삭제하려면 비밀번호를 입력하세요.</p>
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="비밀번호"
              className="w-full p-2 border rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {deleteError && <p className="text-red-500 mb-4">{deleteError}</p>}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeletePopup(null)}
                className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {showSoldPopup !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">상품 상태 변경</h2>
            <p className="mb-4">상품 상태를 변경하려면 비밀번호를 입력하세요.</p>
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="비밀번호"
              className="w-full p-2 border rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {deleteError && <p className="text-red-500 mb-4">{deleteError}</p>}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowSoldPopup(null)}
                className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => handleSoldStatusChange(showSoldPopup.productId, showSoldPopup.itemIndex)}
                className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditPopup !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">상품 수정</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleEditConfirm(); }} className="space-y-4">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="상품명 (필수)"
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <div className="max-h-60 overflow-y-auto pr-2">
                {newItems.map((item, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const updatedItems = [...newItems]
                        updatedItems[index] = e.target.value
                        setNewItems(updatedItems)
                      }}
                      placeholder={index === 0 ? "상품 정보 (필수)" : "추가 상품 정보"}
                      className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required={index === 0}
                    />
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="bg-red-500 text-white p-2 rounded-md hover:bg-red-600 transition-colors"
                        aria-label={`항목 ${index + 1} 삭제`}
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition-colors"
              >
                항목 추가
              </button>
              <input
                type="password"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                placeholder="비밀번호 (필수)"
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              {editError && <p className="text-red-500">{editError}</p>}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditPopup(null)}
                  className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  수정
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="mt-8 flex justify-center items-center gap-2">
        <button
          onClick={() => paginate(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        {[...Array(totalPages)].map((_, i) => (
          <button
            key={i}
            onClick={() => paginate(i + 1)}
            className={`w-8 h-8 rounded-md transition-colors ${
              currentPage === i + 1
                ? 'bg-gray-800 text-white'
                : 'bg-white text-gray-800 hover:bg-gray-100'
            }`}
          >
            {i + 1}
          </button>
        ))}
        <button
          onClick={() => paginate(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <button
        onClick={() => setShowForm(true)}
        className="fixed bottom-8 right-8 w-12 h-12 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors flex items-center justify-center"
        aria-label="새 상품 추가"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  )
}