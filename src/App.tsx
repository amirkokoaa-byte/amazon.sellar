import React, { useState, useEffect } from 'react';
import {
  Menu,
  Plus,
  SlidersHorizontal,
  Coins,
  TrendingUp,
  PackageCheck,
  Cloud,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { ref, onValue, set, push, remove, update } from 'firebase/database';
import { db } from './firebase';
import { ActiveTab, Item, TaxProfitSettings } from './types';
import { getInitialItems } from './utils/seedData';
import { formatCurrency, recalculateItems } from './utils/pricing';
import { Sidebar } from './components/Sidebar';
import { ItemsTable } from './components/ItemsTable';
import { ArchiveTable } from './components/ArchiveTable';
import { ProfitsView } from './components/ProfitsView';
import { AddItemModal } from './components/AddItemModal';
import { EditItemModal } from './components/EditItemModal';
import { ItemDetailsModal } from './components/ItemDetailsModal';
import { TaxProfitModal } from './components/TaxProfitModal';

const DEFAULT_SETTINGS: TaxProfitSettings = {
  taxRate: 14,
  profitRate: 25,
  currency: 'ج.م',
};

export default function App() {
  // 1. Settings state (Synced with Firebase /settings)
  const [settings, setSettings] = useState<TaxProfitSettings>(DEFAULT_SETTINGS);

  // 2. Active Items in Registry (Synced with Firebase /products)
  const [items, setItems] = useState<Item[]>([]);

  // 3. Archived Items (Synced with Firebase /archive)
  const [archivedItems, setArchivedItems] = useState<Item[]>([]);

  // Loading & connection states
  const [isLoading, setIsLoading] = useState(true);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(true);

  // 4. Navigation & Modals state
  const [activeTab, setActiveTab] = useState<ActiveTab>('registry');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isEditItemOpen, setIsEditItemOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [activeItemForDetails, setActiveItemForDetails] = useState<Item | null>(null);
  const [activeItemForEdit, setActiveItemForEdit] = useState<Item | null>(null);

  // -------------------------------------------------------------
  // Realtime Firebase Listeners (Read/Sync across all devices)
  // -------------------------------------------------------------

  // 1. Listen to Settings (/settings)
  useEffect(() => {
    const settingsRef = ref(db, 'settings');
    const unsubscribe = onValue(
      settingsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          setSettings({
            taxRate: data.taxRate !== undefined ? Number(data.taxRate) : DEFAULT_SETTINGS.taxRate,
            profitRate: data.profitRate !== undefined ? Number(data.profitRate) : DEFAULT_SETTINGS.profitRate,
            currency: data.currency || DEFAULT_SETTINGS.currency,
          });
        } else {
          // Initialize default settings in Firebase
          set(settingsRef, DEFAULT_SETTINGS).catch((err) =>
            console.error('Error writing default settings:', err)
          );
        }
      },
      (error) => {
        console.error('Firebase settings listener error:', error);
        setIsFirebaseConnected(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // 2. Listen to Products (/products)
  useEffect(() => {
    const productsRef = ref(db, 'products');
    const unsubscribe = onValue(
      productsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const productList: Item[] = Object.entries(data).map(
            ([key, val]: [string, any]) => ({
              id: key,
              ...val,
            })
          );
          // Sort newest first
          productList.sort(
            (a, b) =>
              new Date(b.createdAt || 0).getTime() -
              new Date(a.createdAt || 0).getTime()
          );
          setItems(productList);
        } else {
          // If completely empty on first launch, seed sample items
          const initial = getInitialItems(settings.taxRate, settings.profitRate);
          const updates: Record<string, any> = {};
          initial.forEach((item) => {
            const newRef = push(productsRef);
            if (newRef.key) {
              const { id, ...dataToSave } = item;
              updates[newRef.key] = dataToSave;
            }
          });
          set(productsRef, updates).catch((err) =>
            console.error('Error seeding initial items:', err)
          );
        }
        setIsLoading(false);
        setIsFirebaseConnected(true);
      },
      (error) => {
        console.error('Firebase products listener error:', error);
        setIsFirebaseConnected(false);
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, [settings.taxRate, settings.profitRate]);

  // 3. Listen to Archive (/archive)
  useEffect(() => {
    const archiveRef = ref(db, 'archive');
    const unsubscribe = onValue(
      archiveRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const archiveList: Item[] = Object.entries(data).map(
            ([key, val]: [string, any]) => ({
              id: key,
              ...val,
            })
          );
          archiveList.sort(
            (a, b) =>
              new Date(b.archivedAt || b.createdAt || 0).getTime() -
              new Date(a.archivedAt || a.createdAt || 0).getTime()
          );
          setArchivedItems(archiveList);
        } else {
          setArchivedItems([]);
        }
      },
      (error) => {
        console.error('Firebase archive listener error:', error);
      }
    );
    return () => unsubscribe();
  }, []);

  // -------------------------------------------------------------
  // Realtime CRUD Operations (Firebase Realtime Database)
  // -------------------------------------------------------------

  // 1. Add Product (Create) -> push() & set() in /products
  const handleSaveNewItem = async (
    newItemData: Omit<Item, 'id' | 'createdAt'>
  ) => {
    try {
      const productsRef = ref(db, 'products');
      const newRef = push(productsRef);
      const dataToSave = {
        ...newItemData,
        createdAt: new Date().toISOString(),
      };
      await set(newRef, dataToSave);
    } catch (err) {
      console.error('Error saving item to Firebase:', err);
      alert('حدث خطأ أثناء حفظ الصنف في السحابة. يرجى التحقق من الاتصال.');
    }
  };

  // 2. Update Product (Update) -> update() in /products/ID
  const handleUpdateItem = async (updated: Item) => {
    try {
      const { id, ...dataToUpdate } = updated;
      const targetRef = ref(db, `products/${id}`);
      await update(targetRef, dataToUpdate);
    } catch (err) {
      console.error('Error updating item in Firebase:', err);
      alert('حدث خطأ أثناء تعديل الصنف.');
    }
  };

  // 3. Archive Product -> copy to /archive/ID, remove from /products/ID
  const handleArchiveItem = async (itemId: string) => {
    const target = items.find((i) => i.id === itemId);
    if (!target) return;
    try {
      const { id, ...itemData } = target;
      const archivedData = {
        ...itemData,
        archivedAt: new Date().toISOString(),
      };
      // 1. Save to archive
      await set(ref(db, `archive/${itemId}`), archivedData);
      // 2. Remove from active products
      await remove(ref(db, `products/${itemId}`));
    } catch (err) {
      console.error('Error archiving item:', err);
      alert('حدث خطأ أثناء أرشفة المنتج.');
    }
  };

  // 4. Restore Product -> copy to /products/ID, remove from /archive/ID
  const handleRestoreItem = async (itemId: string) => {
    const target = archivedItems.find((i) => i.id === itemId);
    if (!target) return;
    try {
      const { id, archivedAt, ...itemData } = target;
      // 1. Save back to products
      await set(ref(db, `products/${itemId}`), itemData);
      // 2. Remove from archive
      await remove(ref(db, `archive/${itemId}`));
    } catch (err) {
      console.error('Error restoring item:', err);
      alert('حدث خطأ أثناء استعادة المنتج.');
    }
  };

  // 5. Delete Product (Delete permanently) -> remove()
  const handleDeleteItem = async (itemId: string) => {
    if (window.confirm('هل أنت متأكد من رغبتك في حذف هذا الصنف سحابياً نهائياً؟')) {
      try {
        await remove(ref(db, `products/${itemId}`));
      } catch (err) {
        console.error('Error deleting item:', err);
        alert('حدث خطأ أثناء حذف المنتج.');
      }
    }
  };

  const handleDeleteArchivedItem = async (itemId: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الصنف من الأرشيف السحابي نهائياً؟')) {
      try {
        await remove(ref(db, `archive/${itemId}`));
      } catch (err) {
        console.error('Error deleting archived item:', err);
        alert('حدث خطأ أثناء حذف الصنف من الأرشيف.');
      }
    }
  };

  // 6. Save Settings & Sync Recalculated Prices across all devices
  const handleSaveSettings = async (newSettings: TaxProfitSettings) => {
    try {
      setSettings(newSettings);
      await set(ref(db, 'settings'), newSettings);

      // Recalculate existing products with the new rates and push to Firebase
      if (items.length > 0) {
        const recalculated = recalculateItems(
          items,
          newSettings.taxRate,
          newSettings.profitRate
        );
        const updates: Record<string, any> = {};
        for (const item of recalculated) {
          updates[`products/${item.id}/priceWithProfit`] = item.priceWithProfit;
          updates[`products/${item.id}/priceAfterTax`] = item.priceAfterTax;
          updates[`products/${item.id}/profitBeforeTax`] = item.profitBeforeTax;
          updates[`products/${item.id}/profitAfterTax`] = item.profitAfterTax;
          updates[`products/${item.id}/profitPerPiece`] = item.profitPerPiece;
          if (item.taxAmount !== undefined) {
            updates[`products/${item.id}/taxAmount`] = item.taxAmount;
          }
        }
        await update(ref(db), updates);
      }
    } catch (err) {
      console.error('Error saving settings to Firebase:', err);
      alert('حدث خطأ أثناء حفظ الإعدادات سحابياً.');
    }
  };

  // View details
  const handleOpenDetails = (item: Item) => {
    setActiveItemForDetails(item);
    setIsDetailsOpen(true);
  };

  // Edit modal
  const handleOpenEdit = (item: Item) => {
    setActiveItemForEdit(item);
    setIsEditItemOpen(true);
  };

  // KPI calculations
  const totalItemsCount = items.length;
  // إجمالي الأرباح: عبارة عن قيمة نسبة الربح فقط على كل منتج (المكسب الصافي المقدر قبل الضريبة)
  const totalProfit = items.reduce(
    (acc, i) => acc + (i.profitBeforeTax ?? i.profitPerPiece ?? 0),
    0
  );
  // المبيعات بعد الضريبة: الأساسي بعد إضافة نسبة الربح وإضافة الـ 14% الضريبة
  const totalSalesAfterTax = items.reduce(
    (acc, i) => acc + (i.priceAfterTax || 0),
    0
  );

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        registryCount={items.length}
        archiveCount={archivedItems.length}
        items={items}
        settings={settings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAddItem={() => setIsAddItemOpen(true)}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Mobile Sidebar Hamburger Toggle */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
              title="فتح القائمة"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900">
                  {activeTab === 'registry'
                    ? 'سجل الأصناف'
                    : 'أرشيف المنتجات'}
                </h1>
                <span className="text-2xs bg-emerald-100/80 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                  {settings.currency}
                </span>

                {/* Cloud Sync Live Status Badge */}
                <div className="hidden xs:flex items-center gap-1 text-3xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>سحابي مباشر</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                الربح: {settings.profitRate}% | الضريبة: {settings.taxRate}% (على السعر بالمكسب)
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 sm:px-3 sm:py-2 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              title="تعديل الضريبة والربح"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden md:inline">الضريبة والربح</span>
            </button>

            <button
              onClick={() => setIsAddItemOpen(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-200 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>أضف صنف</span>
            </button>
          </div>
        </header>

        {/* Top KPI Metrics Strip - All in One Single Row */}
        <div className="px-2.5 sm:px-6 pt-3 sm:pt-5 pb-0">
          <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
            {/* 1. المنتجات المسجله (تظهر كاملة بوضوح تام دون اقتطاع أي جزء من الكلمة) */}
            <div className="bg-white p-2 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <span className="text-[11px] sm:text-xs text-slate-600 font-bold block mb-1 leading-snug whitespace-normal break-words">
                المنتجات المسجله
              </span>
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-lg font-bold text-slate-900 font-mono">
                  {totalItemsCount} <span className="text-[10px] sm:text-xs font-normal">صنف</span>
                </span>
                <div className="hidden sm:flex w-8 h-8 rounded-lg bg-slate-100 text-slate-600 items-center justify-center shrink-0">
                  <PackageCheck className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* 2. إجمالي الأرباح (نسبة الربح فقط على كل منتج مسجل) */}
            <div className="bg-white p-2 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <span className="text-[11px] sm:text-xs text-slate-600 font-bold block mb-1 leading-snug whitespace-normal break-words">
                إجمالي الأرباح
              </span>
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-lg font-bold text-emerald-700 font-mono">
                  +{formatCurrency(totalProfit, settings.currency)}
                </span>
                <div className="hidden sm:flex w-8 h-8 rounded-lg bg-slate-100 text-slate-600 items-center justify-center shrink-0">
                  <Coins className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* 3. المبيعات بعد الضريبة (الأساسي + الربح + 14% الضريبة) */}
            <div className="bg-emerald-50/70 p-2 sm:p-4 rounded-xl sm:rounded-2xl border border-emerald-200/90 shadow-2xs flex flex-col justify-between">
              <span className="text-[11px] sm:text-xs text-emerald-800 font-bold block mb-1 leading-snug whitespace-normal break-words">
                المبيعات بعد الضريبة
              </span>
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-lg font-bold text-emerald-800 font-mono">
                  {formatCurrency(totalSalesAfterTax, settings.currency)}
                </span>
                <div className="hidden sm:flex w-8 h-8 rounded-lg bg-emerald-100/70 text-emerald-700 items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main View: Items Table, Archive, or Profits */}
        <main className="flex-1 p-3 sm:p-6">
          {isLoading ? (
            <div className="p-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
              <p className="text-sm font-bold text-slate-700">
                جارٍ مزامنة البيانات سحابياً من Firebase...
              </p>
            </div>
          ) : activeTab === 'registry' ? (
            <ItemsTable
              items={items}
              settings={settings}
              onOpenAddItem={() => setIsAddItemOpen(true)}
              onViewItemDetails={handleOpenDetails}
              onEditItem={handleOpenEdit}
              onArchiveItem={handleArchiveItem}
              onDeleteItem={handleDeleteItem}
            />
          ) : activeTab === 'archive' ? (
            <ArchiveTable
              archivedItems={archivedItems}
              settings={settings}
              onRestoreItem={handleRestoreItem}
              onDeletePermanently={handleDeleteArchivedItem}
              onViewItemDetails={handleOpenDetails}
              onBackToRegistry={() => setActiveTab('registry')}
            />
          ) : (
            <ProfitsView
              items={items}
              settings={settings}
              onOpenAddItem={() => setIsAddItemOpen(true)}
              onViewItemDetails={handleOpenDetails}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <AddItemModal
        isOpen={isAddItemOpen}
        onClose={() => setIsAddItemOpen(false)}
        onSaveItem={handleSaveNewItem}
        existingItems={[...items, ...archivedItems]}
        settings={settings}
      />

      <EditItemModal
        isOpen={isEditItemOpen}
        item={activeItemForEdit}
        onClose={() => {
          setIsEditItemOpen(false);
          setActiveItemForEdit(null);
        }}
        onUpdateItem={handleUpdateItem}
        settings={settings}
      />

      <ItemDetailsModal
        isOpen={isDetailsOpen}
        item={activeItemForDetails}
        onClose={() => {
          setIsDetailsOpen(false);
          setActiveItemForDetails(null);
        }}
        settings={settings}
        onEdit={(itemToEdit) => {
          handleOpenEdit(itemToEdit);
        }}
        onArchive={(itemId) => {
          handleArchiveItem(itemId);
        }}
        onDelete={(itemId) => {
          handleDeleteItem(itemId);
        }}
      />

      <TaxProfitModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
      />
    </div>
  );
}
