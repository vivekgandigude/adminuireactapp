import React, { useState } from "react";
import { AgGridColumn, AgGridReact } from "ag-grid-react";
import axios from "axios";
import "./App.css";
import "ag-grid-community/dist/styles/ag-grid.css";
import "ag-grid-community/dist/styles/ag-theme-alpine.css";
const APIURL =
  "https://geektrust.s3-ap-southeast-1.amazonaws.com/adminui-problem/members.json";
function App() {
  const [jsonData, setJsonData] = useState([]);
  const [searchBox, setSearchBox] = useState("");
  const [gridColumnApi, setGridColumnApi] = useState(null);
  const [gridApi, setGridApi] = useState("");
  const [rows, setRows] = useState(0);

  const onGridReady = async (params) => {
    setGridApi(params.api);
    setGridColumnApi(params.columnApi);

    try {
      const updateData = (data) => {
        setJsonData(data);
      };

      const responseData = await axios.get(APIURL);
      const data = responseData.data;
      updateData(data);
    } catch (err) {
      console.log(err);
    }
  };

  const onRowEditingStarted = (params) => {
    params.api.refreshCells({
      columns: ["action"],
      rowNodes: [params.node],
      force: true,
    });
  };
  const onRowEditingStopped = (params) => {
    params.api.refreshCells({
      columns: ["action"],
      rowNodes: [params.node],
      force: true,
    });
  };
  const onCellClicked = async (params) => {
    let action;

    if (
      params.column.colId === "action" &&
      params.event.target.dataset.action
    ) {
      action = params.event.target.dataset.action;

      if (action === "edit") {
        params.api.startEditingCell({
          rowIndex: params.node.rowIndex,
          // gets the first columnKey
          colKey: params.columnApi.getDisplayedCenterColumns()[0].colId,
        });
      }

      if (action === "delete") {
        params.api.applyTransaction({
          remove: [params.node.data],
        });
      }

      if (action === "update") {
        try {
          params.api.stopEditing(false);
        } catch (err) {
          console.log(err);
        }
      }

      if (action === "cancel") {
        params.api.stopEditing(true);
      }
    }
  };

  const onSelectionChanged = (params) => {
    params.api.refreshHeader();
  };
  const searchBoxText = (params) => {
    return params.data.name;
  };
  const onFilterTextBoxChanged = (event) => {
    setSearchBox(event.target.value);
    gridApi.setQuickFilter(event.target.value);
  };
  const onSuppressKeyboardEvent = (params) => {
    debugger;
    console.log(params.api.getCellRanges());
  };

  const deleteRows = (params) => {
    console.log(gridApi.getSelectedRows());
    var selectedRows = gridApi.getSelectedRows();
    if (selectedRows != null) {
      if (selectedRows.length > 1) {
        var res = gridApi.updateRowData({ remove: selectedRows });
        console.log(res);
      } else {
        alert("Select atleast 2 rows");
      }
    }
  };
  function onPaginationChanged(params) {
    setRows(params.api.getSelectedRows().length);
    console.log("onPaginationPageLoaded");

    params.api.deselectAll();
    let paginationSize = params.api.paginationGetPageSize();
    let currentPageNum = params.api.paginationGetCurrentPage();
    let totalRowsCount = params.api.getDisplayedRowCount();

    //Calculate current page row indexes
    let currentPageRowStartIndex = currentPageNum * paginationSize;
    let currentPageRowLastIndex = currentPageRowStartIndex + paginationSize;
    if (currentPageRowLastIndex > totalRowsCount)
      currentPageRowLastIndex = totalRowsCount;

    for (let i = 0; i < totalRowsCount; i++) {
      //Set isRowSelectable=true attribute for current page rows, and false for other page rows
      let isWithinCurrentPage =
        i >= currentPageRowStartIndex && i < currentPageRowLastIndex;
      params.api
        .getDisplayedRowAtIndex(i)
        .setRowSelectable(isWithinCurrentPage);
    }
    params.api.refreshHeader();
  }

  function isFirstColumn(params) {
    var displayedColumns = params.columnApi.getAllDisplayedColumns();
    var thisIsFirstColumn = displayedColumns[0] === params.column;
    return thisIsFirstColumn;
  }
  return (
    <div className="App">
      <header> Admin UI</header>
      <br />
      <div className="example-header">
        <span id="selectedRows"></span>
      </div>
      <input
        type="text"
        id="filter-text-box"
        placeholder="Search from table..."
        value={searchBox}
        onChange={onFilterTextBoxChanged}
      />
      <br />

      <div className="ag-theme-alpine" style={{ height: 550, width: 1000 }}>
        <AgGridReact
          getRowNodeId={(n) => n.id}
          immutableData={true}
          rowData={jsonData}
          pagination={true}
          rowSelection={"multiple"}
          onSelectionChanged={onSelectionChanged}
          paginationPageSize="10"
          onGridReady={onGridReady}
          enableRangeSelection={true}
          defaultColDef={{
            flex: 1,
            minWidth: 110,
            editable: true,
            resizable: true,
            sortable: true,
            suppressKeyboardEvent: onSuppressKeyboardEvent,
            checkboxSelection: isFirstColumn,
          }}
          editType="fullRow"
          onCellClicked={onCellClicked}
          onRowEditingStopped={onRowEditingStopped}
          onRowEditingStarted={onRowEditingStarted}
          onPaginationChanged={onPaginationChanged}
        >
          <AgGridColumn
            field="id"
            editable={false}
            filter={true}
            checkboxSelection={true}
            headerCheckboxSelection={true}
            headerCheckboxSelectionFilteredOnly={false}
            suppressMovable={true}
          ></AgGridColumn>
          <AgGridColumn
            field="name"
            filter={true}
            getQuickFilterText={searchBoxText}
          ></AgGridColumn>
          <AgGridColumn field="email" filter={true}></AgGridColumn>
          <AgGridColumn field="role" filter={true}></AgGridColumn>
          <AgGridColumn
            cellRenderer={actionCellRender}
            colId="action"
            minWidth="150"
            headerName="Actions"
            editable={false}
          ></AgGridColumn>
        </AgGridReact>
      </div>
      <button onClick={deleteRows}>Delete</button>
    </div>
  );
}
const actionCellRender = (params) => {
  let eGui = document.createElement("div");

  let editingCells = params.api.getEditingCells();
  // checks if the rowIndex matches in at least one of the editing cells
  let isCurrentRowEditing = editingCells.some((cell) => {
    return cell.rowIndex === params.node.rowIndex;
  });

  if (isCurrentRowEditing) {
    eGui.innerHTML = `
    <button  class="action-button update"  data-action="update"> update  </button>
    <button  class="action-button cancel"  data-action="cancel" > cancel </button>
    `;
  } else {
    eGui.innerHTML = `
    <button class="action-button edit"  data-action="edit" > edit  </button>
    <button class="action-button delete" data-action="delete" > delete </button>
    `;
  }

  return eGui;
};
export default App;
