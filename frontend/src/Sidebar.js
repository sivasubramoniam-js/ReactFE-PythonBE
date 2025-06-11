import { Box, List, ListItem, ListItemText, Divider, Typography } from "@mui/material";

const Sidebar = ({ activeDocs, archivedDocs, onRestore, onDelete }) => {
  return (
    <Box sx={{ width: 300, p: 2, borderRight: 1, borderColor: 'divider', height: '90vh' }}>
      {/* Active Documents Section */}
      <Typography variant="h6" style={{ margin: 0 }}>Active Documents</Typography>
      <List>
            {activeDocs.map((doc, docIndex) => (
                <>
      {!!docIndex && <Divider />}
              <ListItem key={doc.id}>
                <ListItemText
                  primary={doc.title}
                  secondary={`Last updated: ${doc.updatedAt}`}
                />
              </ListItem>
              </>
            ))}
          </List>
    </Box>
  );
};

export default Sidebar;
