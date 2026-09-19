import React, { useState } from 'react';
import { ContactsProvider, useContacts } from './context/ContactsContext';
import { Header } from './components/Header';
import { SummaryCards } from './components/SummaryCards';
import { TimelineView } from './components/TimelineView';
import { ContactsListView } from './components/ContactsListView';
import { CalendarView } from './components/CalendarView';
import { StatsView } from './components/StatsView';
import { SettingsView } from './components/SettingsView';
import { MapView } from './components/MapView';
import { BottomNav } from './components/BottomNav';
import { ContactDetailModal } from './components/ContactDetailModal';
import { ContactFormModal } from './components/ContactFormModal';
import { SmartSearchModal } from './components/SmartSearchModal';
import { DuplicatesModal } from './components/DuplicatesModal';
import { ImportExportModal } from './components/ImportExportModal';
import { PrivacyModal } from './components/PrivacyModal';
import { AiAssistantModal } from './components/AiAssistantModal';
import { OnboardingModal } from './components/OnboardingModal';
import { InstallModal } from './components/InstallModal';
import { PinLockScreen } from './components/PinLockScreen';
import { AppTab, Contact } from './types';

function MainApp() {
  const {
    selectedContact,
    setSelectedContact,
    isPinLocked,
    settings,
  } = useContacts();

  const [currentTab, setCurrentTab] = useState<AppTab>('timeline');

  // Modals state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [contactToEdit, setContactToEdit] = useState<Contact | null>(null);
  const [isDuplicatesOpen, setIsDuplicatesOpen] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isInstallOpen, setIsInstallOpen] = useState(false);

  // Handle Android App Shortcuts from Home Screen (/#add, /#timeline, /#map)
  React.useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash === '#add') {
        setContactToEdit(null);
        setIsAddContactOpen(true);
      } else if (hash === '#timeline') {
        setCurrentTab('timeline');
      } else if (hash === '#map') {
        setCurrentTab('map');
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // If locked by PIN
  if (isPinLocked) {
    return <PinLockScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors selection:bg-indigo-500 selection:text-white">
      {/* Sticky Top Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAddContact={() => {
          setContactToEdit(null);
          setIsAddContactOpen(true);
        }}
        onOpenAiAssistant={() => setIsAiOpen(true)}
        onOpenImportExport={() => setIsImportExportOpen(true)}
        onOpenInstallModal={() => setIsInstallOpen(true)}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 pt-2 pb-24">
        {/* Dynamic Summary Cards (always handy on contacts and timeline views) */}
        {(currentTab === 'timeline' || currentTab === 'contacts') && (
          <SummaryCards
            onOpenDuplicates={() => setIsDuplicatesOpen(true)}
            setCurrentTab={setCurrentTab}
            onOpenImportExport={() => setIsImportExportOpen(true)}
          />
        )}

        {/* Tab 1: Timeline */}
        {currentTab === 'timeline' && (
          <TimelineView
            onSelectContact={(c) => setSelectedContact(c)}
            onOpenAddContact={() => {
              setContactToEdit(null);
              setIsAddContactOpen(true);
            }}
            onOpenImportExport={() => setIsImportExportOpen(true)}
          />
        )}

        {/* Tab 2: Contacts List */}
        {currentTab === 'contacts' && (
          <ContactsListView
            onSelectContact={(c) => setSelectedContact(c)}
            onOpenAddContact={() => {
              setContactToEdit(null);
              setIsAddContactOpen(true);
            }}
            onOpenImportExport={() => setIsImportExportOpen(true)}
          />
        )}

        {/* Tab: Map (Dónde y Cuándo se guardaron) */}
        {currentTab === 'map' && (
          <MapView
            onSelectContact={(c) => setSelectedContact(c)}
            onOpenAddContact={() => {
              setContactToEdit(null);
              setIsAddContactOpen(true);
            }}
          />
        )}

        {/* Tab 3: Calendar */}
        {currentTab === 'calendar' && (
          <CalendarView
            onSelectContact={(c) => setSelectedContact(c)}
            onOpenAddContact={() => {
              setContactToEdit(null);
              setIsAddContactOpen(true);
            }}
          />
        )}

        {/* Tab 4: Statistics */}
        {currentTab === 'stats' && <StatsView />}

        {/* Tab 5: Settings */}
        {currentTab === 'settings' && (
          <SettingsView
            onOpenPrivacyModal={() => setIsPrivacyOpen(true)}
            onOpenImportExport={() => setIsImportExportOpen(true)}
            onOpenInstallModal={() => setIsInstallOpen(true)}
          />
        )}
      </main>

      {/* Bottom Navigation for Mobile / Tablet */}
      <BottomNav currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Modals & Dialogs */}
      <InstallModal
        isOpen={isInstallOpen}
        onClose={() => setIsInstallOpen(false)}
      />
      <ContactDetailModal
        contact={selectedContact}
        onClose={() => setSelectedContact(null)}
        onEdit={(contact) => {
          setContactToEdit(contact);
          setIsAddContactOpen(true);
        }}
      />

      <ContactFormModal
        isOpen={isAddContactOpen}
        contactToEdit={contactToEdit}
        onClose={() => {
          setIsAddContactOpen(false);
          setContactToEdit(null);
        }}
      />

      <SmartSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      <DuplicatesModal
        isOpen={isDuplicatesOpen}
        onClose={() => setIsDuplicatesOpen(false)}
      />

      <ImportExportModal
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
      />

      <PrivacyModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
      />

      <AiAssistantModal
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
      />

      <OnboardingModal
        isOpen={isOnboardingOpen}
        onComplete={() => setIsOnboardingOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ContactsProvider>
      <MainApp />
    </ContactsProvider>
  );
}
