import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { DataTable, DataTableStateEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { OverlayPanel } from 'primereact/overlaypanel';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { FaChevronDown } from 'react-icons/fa';

import 'primereact/resources/primereact.min.css';
import 'primereact/resources/themes/saga-blue/theme.css';

interface Artwork {
  id: number;
  title: string;
  place_of_origin: string;
  artist_display: string;
  inscriptions: string | null;
  date_start: number | null;
  date_end: number | null;
}

const DataTableComponent: React.FC = () => {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [selectedArtworks, setSelectedArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [overlayLoading, setOverlayLoading] = useState<boolean>(false);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [inputValue, setInputValue] = useState<string>('');
  const overlayPanelRef = useRef<OverlayPanel>(null);
  const rowsPerPage = 12;

  const fetchArtworks = async (page: number) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `https://api.artic.edu/api/v1/artworks?page=${page}`
      );
      const data = response.data;

      if (data && data.data) {
        setArtworks(data.data);
        setTotalRecords(data.pagination.total);
        setCurrentPage(data.pagination.current_page);
      }
    } catch (error) {
      console.error('Error fetching artworks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArtworks(currentPage);
  }, []);

  const onPageChange = (event: DataTableStateEvent) => {
    const nextPage = (event.page ?? 0) + 1;
    fetchArtworks(nextPage);
  };

  const handleSubmit = async () => {
    const numberOfItems = parseInt(inputValue, 10);

    if (isNaN(numberOfItems) || numberOfItems <= 0) {
      console.error('Invalid input. Please enter a positive number.');
      return;
    }

    setOverlayLoading(true);
    let selectedItems: Artwork[] = [];
    let currentPageToFetch = 1;

    while (selectedItems.length < numberOfItems) {
      try {
        const response = await axios.get(
          `https://api.artic.edu/api/v1/artworks?page=${currentPageToFetch}`
        );
        const data = response.data;

        if (data && data.data) {
          const artworksFromPage: Artwork[] = data.data;
          const remainingItemsToSelect = numberOfItems - selectedItems.length;
          const uniqueItems = artworksFromPage.filter(
            (artwork) =>
              !selectedItems.some((selected) => selected.id === artwork.id)
          );

          selectedItems = [
            ...selectedItems,
            ...uniqueItems.slice(0, remainingItemsToSelect),
          ];

          if (artworksFromPage.length < remainingItemsToSelect) {
            if (
              data.pagination &&
              data.pagination.current_page < data.pagination.total_pages
            ) {
              currentPageToFetch++;
            } else {
              console.warn('Not enough items available to fulfill the request.');
              break;
            }
          } else {
            break;
          }
        } else {
          console.error('No data found for the current page.');
          break;
        }
      } catch (error) {
        console.error('Error fetching artworks:', error);
        break;
      }
    }

    setSelectedArtworks(selectedItems);
    setOverlayLoading(false);
    overlayPanelRef.current?.hide();
  };

  return (
    <div className="p-4" style={{ position: 'relative' }}>
      <h1 className="text-xl font-bold mb-4">Artworks</h1>

      {loading && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <ProgressSpinner style={{ width: '50px', height: '50px' }} />
        </div>
      )}

      <DataTable
        value={artworks}
        paginator
        rows={rowsPerPage}
        totalRecords={totalRecords}
        lazy
        first={(currentPage - 1) * rowsPerPage}
        onPage={onPageChange}
        selection={selectedArtworks}
        onSelectionChange={(e) => setSelectedArtworks(e.value)}
        dataKey="id"
        selectionMode="checkbox"
      >
        <Column selectionMode="multiple" headerStyle={{ width: '3em' }}></Column>

        <Column
          field=""
          header={
            <div className="flex items-center">
              <FaChevronDown
                className="ml-2 text-gray-500 cursor-pointer"
                onClick={(e) => overlayPanelRef.current?.toggle(e)}
              />
              <OverlayPanel
                ref={overlayPanelRef}
                style={{ width: '230px' }}
              >
                <div
                  className="p-4"
                  style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
                >
                  {overlayLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <ProgressSpinner style={{ width: '40px', height: '40px' }} />
                    </div>
                  ) : (
                    <>
                      <InputText
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Enter number of items"
                        className="w-full"
                      />
                      <Button
                        label="Submit"
                        onClick={handleSubmit}
                        className="p-button-sm p-button-primary"
                        style={{ width: '100%', backgroundColor: 'brown' }}
                      />
                    </>
                  )}
                </div>
              </OverlayPanel>
            </div>
          }
        ></Column>

        <Column field="title" header="Title"></Column>
        <Column field="place_of_origin" header="Origin"></Column>
        <Column field="artist_display" header="Artist"></Column>
        <Column field="inscriptions" header="Inscriptions"></Column>
        <Column field="date_start" header="Start Date"></Column>
        <Column field="date_end" header="End Date"></Column>
      </DataTable>

      {selectedArtworks.length > 0 && (
        <div className="mt-4">
          <h2 className="font-bold">Selected Artworks:</h2>
          <ul>
            {selectedArtworks.map((artwork, index) => (
              <li key={`${artwork.id}-${index}`}>{artwork.title}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DataTableComponent;
